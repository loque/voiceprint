import logging
import uuid
import os
import json
from typing import Dict, List, Any
import librosa
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras import layers, models, regularizers, callbacks, optimizers  # type: ignore
import matplotlib.pyplot as plt
from dataclasses import dataclass
import time

MODEL_FILENAME = "voiceprint_model.h5"
TRAINING_HISTORY_FILENAME = "training_history.npy"
TRAINING_HISTORY_PLOT_FILENAME = "training_history_plot.png"
MFCCS_FILENAME = "mfccs.npy"
LABELS_FILENAME = "labels.npy"
LABEL_MAPPING_FILENAME = "label_mapping.npy"
SCALER_MEAN_FILENAME = "scaler_mean.npy"
SCALER_SCALE_FILENAME = "scaler_scale.npy"

@dataclass
class IdentifyResponse:
    predicted_speaker: str | None = None
    confidence: float | None = None
    all_predictions: Dict[str, float] | None = None
    processing_time_ms: float | None = None
    error: str | None = None
    
Voices = Dict[str, List[str]]

VOICES_PATH = os.getenv('VOICES_PATH')

class ModelService:
    @staticmethod
    def create(name: str, voices: Voices, logger: logging.Logger, models_path: str):
        model_id = uuid.uuid4().hex[:8]
        model_path = os.path.join(models_path, model_id)
        os.makedirs(model_path, exist_ok=True)

        model_service = ModelService.__new__(ModelService)
        model_service.id = model_id
        model_service.path = model_path
        model_service.name = name
        model_service.voices = voices
        model_service.logger = logger
        model_service.mfccs = None
        model_service.labels = None
        model_service.label_mapping = None
        model_service.scaler_mean = None
        model_service.scaler_scale = None

        return model_service
    
    @staticmethod
    def load(model_id: str, models_path: str, logger: logging.Logger):
        """
        Load a model using its model_id, fetch metadata.json, and instantiate a Model object.
        """
        model_path = os.path.join(models_path, model_id)
        metadata_path = os.path.join(model_path, 'metadata.json')

        if not os.path.exists(metadata_path):
            logger.error(f"Metadata file not found at '{metadata_path}'")
            raise FileNotFoundError(f"Metadata file not found at '{metadata_path}'")

        with open(metadata_path, 'r') as f:
            metadata = json.load(f)

        model = ModelService.__new__(ModelService)
        model.id = metadata['id']
        model.name = metadata['name']
        model.voices = metadata['voices']
        model.mfccs = metadata['mfccs']
        model.labels = metadata['labels']
        model.label_mapping = metadata['label_mapping']
        model.scaler_mean = metadata['scaler_mean']
        model.scaler_scale = metadata['scaler_scale']
        model.path = model_path
        model.logger = logger
        model.isLoaded = True

        logger.info(f"Model '{model_id}' loaded successfully from '{metadata_path}'")
        return model
        
    def saveMetadata(self):
        """
        Save model metadata (excluding logger and path) to metadata.json in self.path.
        """
        metadata = {
            "id": self.id,
            "name": self.name,
            "voices": self.voices,
            "mfccs": self.mfccs if self.mfccs is not None else None,
            "labels": self.labels if self.labels is not None else None,
            "label_mapping": self.label_mapping if self.label_mapping is not None else None,
            "scaler_mean": self.scaler_mean if self.scaler_mean is not None else None,
            "scaler_scale": self.scaler_scale if self.scaler_scale is not None else None,
        }
        with open(os.path.join(self.path, "metadata.json"), "w") as f:
            json.dump(metadata, f, indent=2)
        self.logger.info(f"Saved metadata to {os.path.join(self.path, 'metadata.json')}")
    
    def extract_mfccs(self, fixed_length: int = 100, n_mfcc: int = 13):
        """
        Extract MFCCs from the audio files in self.voices, save to self.path, and populate self fields.
        """
        os.makedirs(self.path, exist_ok=True)
        mfcc_data = []
        labels = []
        for speaker, files in self.voices.items():
            for audio_file in files:
                if not audio_file.endswith(".wav"):
                    continue
                audio_path = os.path.join(VOICES_PATH, speaker, audio_file)
                audio, sr = librosa.load(audio_path, sr=16000)
                mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=n_mfcc)
                mfcc_data.append(mfccs.T)  # (n_frames, n_mfcc)
                labels.append(speaker)
                
        # Pad/trim MFCCs
        processed_mfccs = []
        
        for mfccs in mfcc_data:
            if mfccs.shape[0] > fixed_length:
                mfccs = mfccs[:fixed_length]
            elif mfccs.shape[0] < fixed_length:
                padding = np.zeros((fixed_length - mfccs.shape[0], mfccs.shape[1]))
                mfccs = np.vstack((mfccs, padding))
            processed_mfccs.append(mfccs)
            
        processed_mfccs = np.array(processed_mfccs)
        labels_arr = np.array(labels)
        
        encoder = LabelEncoder()
        encoded_labels = encoder.fit_transform(labels_arr)
        
        label_mapping = dict(zip(encoder.classes_, range(len(encoder.classes_))))
        
        self.mfccs = os.path.join(self.path, MFCCS_FILENAME)
        self.labels = os.path.join(self.path, LABELS_FILENAME)
        self.label_mapping = os.path.join(self.path, LABEL_MAPPING_FILENAME)

        # Save files
        np.save(self.mfccs, processed_mfccs)
        np.save(self.labels, encoded_labels)
        np.save(self.label_mapping, label_mapping)

        self.logger.info(f"Extracted MFCCs for {len(processed_mfccs)} files to {self.path}")
    
    def train(self, batch_size: int = 32, epochs: int = 50):
          """
          Train a voiceprint model using the MFCCs and labels stored in self.path.
          """
          # Load data
          mfccs = np.load(self.mfccs)
          labels = np.load(self.labels)

          # Ensure consistent shapes (e.g., add channel dimension for CNN)
          if len(mfccs.shape) == 3:  # Shape: (n_samples, n_frames, n_mfcc)
              mfccs = np.expand_dims(mfccs, axis=-1)  # Add channel dimension: (n_samples, n_frames, n_mfcc, 1)

          # Encode labels if not already done
          encoder = LabelEncoder()
          encoded_labels = encoder.fit_transform(labels)
      
          # Split into train and test sets
          X_train, X_test, y_train, y_test = train_test_split(mfccs, labels, test_size=0.2, random_state=42)

          # Normalize MFCCs
          scaler = StandardScaler()
          X_train_flat = X_train.reshape(X_train.shape[0], -1)  # Flatten for scaling
          X_test_flat = X_test.reshape(X_test.shape[0], -1)
          scaler.fit(X_train_flat)
          X_train_flat = scaler.transform(X_train_flat)
          X_test_flat = scaler.transform(X_test_flat)
          
          # Save scaler parameters for later use in prediction
          np.save(os.path.join(self.path, SCALER_MEAN_FILENAME), scaler.mean_)
          np.save(os.path.join(self.path, SCALER_SCALE_FILENAME), scaler.scale_)

          # Reshape back to original shape
          X_train = X_train_flat.reshape(X_train.shape)
          X_test = X_test_flat.reshape(X_test.shape)

          # Create TensorFlow datasets
          batch_size = 32
          X_train_tensor = tf.convert_to_tensor(X_train, dtype=tf.float32)
          y_train_tensor = tf.convert_to_tensor(y_train, dtype=tf.int32)
          X_test_tensor = tf.convert_to_tensor(X_test, dtype=tf.float32)
          y_test_tensor = tf.convert_to_tensor(y_test, dtype=tf.int32)

          train_dataset = tf.data.Dataset.from_tensor_slices((X_train_tensor, y_train_tensor))
          train_dataset = train_dataset.shuffle(buffer_size=X_train.shape[0])
          train_dataset = train_dataset.map(_augment_map_fn, num_parallel_calls=tf.data.AUTOTUNE)
          train_dataset = train_dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)

          val_dataset = tf.data.Dataset.from_tensor_slices((X_test_tensor, y_test_tensor))
          val_dataset = val_dataset.batch(batch_size).prefetch(tf.data.AUTOTUNE)

          # Define the model
          l2 = regularizers.l2
          model = models.Sequential([
              layers.Conv2D(32, (3, 3), padding='same', activation='relu', input_shape=X_train.shape[1:], 
                            kernel_regularizer=l2(0.001)),
              layers.BatchNormalization(),
              layers.MaxPooling2D((2, 2)),
              layers.Dropout(0.2),
              layers.Conv2D(64, (3, 3), padding='same', activation='relu', kernel_regularizer=l2(0.001)),
              layers.BatchNormalization(),
              layers.MaxPooling2D((2, 2)),
              layers.Dropout(0.3),
              layers.Flatten(),
              layers.Dense(128, activation='relu', kernel_regularizer=l2(0.001)),
              layers.BatchNormalization(),
              layers.Dropout(0.5),
              layers.Dense(len(np.unique(encoded_labels)), activation='softmax')
          ])

          optimizer = optimizers.Adam(learning_rate=0.001)
          model.compile(optimizer=optimizer,
                        loss='sparse_categorical_crossentropy',
                        metrics=['accuracy'])

          # Define callbacks
          early_stopping = callbacks.EarlyStopping(
              monitor='val_loss',
              patience=5,
              restore_best_weights=True,
              verbose=1
          )
          reduce_lr = callbacks.ReduceLROnPlateau(
              monitor='val_loss',
              factor=0.2,
              patience=3,
              min_lr=0.0001,
              verbose=1
          )

          # Train the model
          epochs = 50
          history = model.fit(
              train_dataset,
              epochs=epochs,
              validation_data=val_dataset,
              callbacks=[early_stopping, reduce_lr],
              verbose=1
          )

          # Save the model
          model_path = os.path.join(self.path, MODEL_FILENAME)
          model.save(model_path)
          self.logger.info(f"Model saved to '{model_path}'")
          
          # Save training history
          history_path = os.path.join(self.path, TRAINING_HISTORY_FILENAME)
          np.save(history_path, history.history)
          self.logger.info(f"Training history saved to '{history_path}'")

    def plot(self):
          """
          Plot and save training history from the training process.
          """
          history_path = os.path.join(self.path, TRAINING_HISTORY_FILENAME)
          if not os.path.exists(history_path):
              self.logger.error(f"Training history not found at '{history_path}'")
              return

          history = np.load(history_path, allow_pickle=True).item()

          plt.figure(figsize=(12, 4))
          plt.subplot(1, 2, 1)
          plt.plot(history['accuracy'], label='Training Accuracy')
          plt.plot(history['val_accuracy'], label='Validation Accuracy')
          plt.title('Model Accuracy')
          plt.xlabel('Epoch')
          plt.ylabel('Accuracy')
          plt.legend()

          plt.subplot(1, 2, 2)
          plt.plot(history['loss'], label='Training Loss')
          plt.plot(history['val_loss'], label='Validation Loss')
          plt.title('Model Loss')
          plt.xlabel('Epoch')
          plt.ylabel('Loss')
          plt.legend()

          plt.tight_layout()
          plot_path = os.path.join(self.path, TRAINING_HISTORY_PLOT_FILENAME)
          plt.savefig(plot_path)
          self.logger.info(f"Training history plot saved to '{plot_path}'")

    def loadResources(self):
        self.logger.info("Initializing Interpreter and loading resources...")
        

        # Load the model
        model_path = os.path.join(self.path, MODEL_FILENAME)
        self.model: tf.keras.Model = tf.keras.models.load_model(model_path)
        self.logger.info(f"Model loaded from {model_path}.")

        # Load the labels
        labels_path = os.path.join(self.path, LABELS_FILENAME)
        labels_data = np.load(labels_path)
        self.encoder: LabelEncoder = LabelEncoder()
        self.encoder.fit(labels_data)
        self.logger.info(f"Labels loaded from {labels_path}.")

        # Load label mapping
        label_mapping_path = os.path.join(self.path, LABEL_MAPPING_FILENAME)
        label_mapping = np.load(label_mapping_path, allow_pickle=True).item()
        self.reverse_label_mapping: dict[Any, Any] = {v: k for k, v in label_mapping.items()}
        self.logger.info(f"Label mapping loaded from {label_mapping_path}.")

        # Load scaler parameters
        scaler_mean_path = os.path.join(self.path, SCALER_MEAN_FILENAME)
        scaler_scale_path = os.path.join(self.path, SCALER_SCALE_FILENAME)
        self.scaler_mean: np.ndarray = np.load(scaler_mean_path)
        self.scaler_scale: np.ndarray = np.load(scaler_scale_path)
        self.logger.info(f"Scaler parameters loaded from {scaler_mean_path} and {scaler_scale_path}.")
        
        self.logger.info("Interpreter initialized and resources loaded successfully.")
    
    def identify(self, audio_file_path: str) -> IdentifyResponse:
        start_time = time.perf_counter()

        try:
            # Load the audio file
            y, sr = librosa.load(audio_file_path, sr=None)

            # Extract MFCCs
            n_mfcc = 13
            n_frames = 100
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)

            # Transpose to get time as the first dimension
            mfccs = mfccs.T

            # Pad or truncate to fixed length
            if mfccs.shape[0] < n_frames:
                pad_width = n_frames - mfccs.shape[0]
                mfccs = np.pad(mfccs, ((0, pad_width), (0, 0)), mode='constant')
            else:
                mfccs = mfccs[:n_frames, :]

            # Add channel dimension for CNN
            mfccs = np.expand_dims(mfccs, axis=-1)

            # Add batch dimension
            mfccs = np.expand_dims(mfccs, axis=0)

            # Apply scaling
            mfccs_flat = mfccs.reshape(mfccs.shape[0], -1)
            if mfccs_flat.shape[1] == self.scaler_mean.shape[0]:
                mfccs_flat = (mfccs_flat - self.scaler_mean) / self.scaler_scale
                mfccs = mfccs_flat.reshape(mfccs.shape)
                self.logger.info("Scaling applied to input.")
            else:
                self.logger.warning(f"Warning: MFCC features shape {mfccs_flat.shape[1]} mismatch with scaler mean shape {self.scaler_mean.shape[0]}. Skipping scaling.")


            # Predict
            prediction_result = self.model.predict(mfccs, verbose=0)

            predicted_class_idx = np.argmax(prediction_result, axis=1)[0]
            confidence = float(prediction_result[0][predicted_class_idx])
            speaker_name = self.reverse_label_mapping.get(predicted_class_idx, "Unknown")

            all_predictions = {
                self.reverse_label_mapping.get(i, "Unknown"): float(conf)
                for i, conf in enumerate(prediction_result[0])
            }
            
            processing_time_ms = (time.perf_counter() - start_time) * 1000
            
            return IdentifyResponse(
                predicted_speaker=speaker_name,
                confidence=confidence,
                all_predictions=all_predictions,
                processing_time_ms=processing_time_ms
            )

        except Exception as e:
            self.logger.error(f"Error during identification: {e}", exc_info=True)
            processing_time_ms = (time.perf_counter() - start_time) * 1000
            return IdentifyResponse(error=str(e), processing_time_ms=processing_time_ms)


# Create data augmentation for training using tf.data API
def _augment_map_fn(x, y):
    """Apply augmentation to a single example"""
    # Random noise
    if tf.random.uniform([], 0, 1) > 0.5:
        noise_level = tf.random.uniform([], 0.001, 0.005)
        noise = tf.random.normal(tf.shape(x), mean=0.0, stddev=noise_level)
        x = x + noise
        
    # Time masking
    if tf.random.uniform([], 0, 1) > 0.5:
        t_width = tf.random.uniform([], 1, 5, dtype=tf.int32)
        t_start = tf.random.uniform([], 0, tf.shape(x)[0] - t_width, dtype=tf.int32)
        mask = tf.ones([t_width, tf.shape(x)[1], tf.shape(x)[2]])
        paddings = [[t_start, tf.shape(x)[0] - t_start - t_width], [0, 0], [0, 0]]
        mask = tf.pad(mask, paddings)
        x = x * (1.0 - mask)
    
    # Frequency masking
    if tf.random.uniform([], 0, 1) > 0.5:
        f_width = tf.random.uniform([], 1, 3, dtype=tf.int32)
        f_start = tf.random.uniform([], 0, tf.shape(x)[1] - f_width, dtype=tf.int32)
        mask = tf.ones([tf.shape(x)[0], f_width, tf.shape(x)[2]])
        paddings = [[0, 0], [f_start, tf.shape(x)[1] - f_start - f_width], [0, 0]]
        mask = tf.pad(mask, paddings)
        x = x * (1.0 - mask)
        
    return x, y