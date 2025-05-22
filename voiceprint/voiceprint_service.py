from dataclasses import dataclass
import logging
import time
from typing import Any, Dict

import numpy as np
import librosa
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow.keras import layers, models, regularizers, callbacks, optimizers

from speaker_repository import SpeakerRepository
from voiceprint_model import VoiceprintModel
from voiceprint_repository import VoiceprintRepository

MODEL_FILENAME = "voiceprint_model.h5"
TRAINING_HISTORY_FILENAME = "training_history.npy"
TRAINING_HISTORY_PLOT_FILENAME = "training_history_plot.png"
MFCCS_FILENAME = "mfccs.npy"
LABELS_FILENAME = "labels.npy"
LABEL_MAPPING_FILENAME = "label_mapping.npy"
SCALER_MEAN_FILENAME = "scaler_mean.npy"
SCALER_SCALE_FILENAME = "scaler_scale.npy"

class ExtractMfccsOptions:
  def __init__(self, fixed_length: int = 100, n_mfcc: int = 13):
    self.fixed_length = fixed_length
    self.n_mfcc = n_mfcc

class LoadedParameters:
  def __init__(self, voiceprint_id: str, model: tf.keras.Model, scaler_mean: np.ndarray, scaler_scale: np.ndarray, reverse_label_mapping: dict[Any, Any]):
    self.voiceprint_id = voiceprint_id
    self.model = model
    self.scaler_mean = scaler_mean
    self.scaler_scale = scaler_scale
    self.reverse_label_mapping = reverse_label_mapping

@dataclass
class IdentifyResponse:
  predicted_speaker: str | None = None
  confidence: float | None = None
  all_predictions: Dict[str, float] | None = None
  processing_time_ms: float | None = None
  error: str | None = None

class GetVoiceprintsResponse(VoiceprintModel):
  isLoaded: bool = False

  def __init__(self, id: str, name: str, speakers: dict, isLoaded: bool = False):
    super().__init__(id=id, name=name, speakers=speakers)
    self.isLoaded = isLoaded

class VoiceprintService:
  def __init__(self, repo: VoiceprintRepository, speakers_repo: SpeakerRepository, logger: logging.Logger = None):
    self.repo = repo
    self.speakers_repo = speakers_repo
    self.logger = logger or logging.getLogger(__name__)
    self.loaded_parameters: LoadedParameters = None
  
  def get_voiceprints(self) -> list[GetVoiceprintsResponse]:
    """
    Returns a list of VoiceprintModel objects with an additional 'isLoaded' property.
    """
    voiceprints = self.repo.get_voiceprints()
    loaded_vp_id = self.loaded_parameters.voiceprint_id if self.loaded_parameters else None
    response = []
    for vp in voiceprints:
      if hasattr(vp, 'id') and vp.id == loaded_vp_id:
        response.append(GetVoiceprintsResponse(id=vp.id, name=vp.name, speakers=vp.speakers, isLoaded=True))
      else:
        response.append(GetVoiceprintsResponse(id=vp.id, name=vp.name, speakers=vp.speakers, isLoaded=False))
    return response

  def create_voiceprint(self, name: str, speakers: dict) -> VoiceprintModel:
    voiceprint_model = VoiceprintModel(name=name, speakers=speakers)
    self.repo.add_voiceprint(voiceprint_model)
    return voiceprint_model
  
  def extract_mfccs(self, voiceprint_id: str, options: ExtractMfccsOptions = ExtractMfccsOptions()) -> None:
    voiceprint_model = self.repo.get_voiceprint(voiceprint_id)

    # Collect MFCCs
    mfcc_data = []
    labels = []
    for speaker, files in voiceprint_model.speakers.items():
      for audio_file in files:
        if not audio_file.endswith(".wav"):
          continue
        audio_path = self.speakers_repo.get_sample_path(speaker, audio_file)
        audio, sr = librosa.load(audio_path, sr=16000)
        mfccs = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=options.n_mfcc)
        mfcc_data.append(mfccs.T)  # (n_frames, n_mfcc)
        labels.append(speaker)
            
    # Pad/trim MFCCs
    processed_mfccs = []
    for mfccs in mfcc_data:
      if mfccs.shape[0] > options.fixed_length:
        mfccs = mfccs[:options.fixed_length]
      elif mfccs.shape[0] < options.fixed_length:
        padding = np.zeros((options.fixed_length - mfccs.shape[0], mfccs.shape[1]))
        mfccs = np.vstack((mfccs, padding))
      processed_mfccs.append(mfccs)
        
    processed_mfccs = np.array(processed_mfccs)
    labels_arr = np.array(labels)
    
    encoder = LabelEncoder()
    encoded_labels = encoder.fit_transform(labels_arr)
    
    label_mapping = dict(zip(encoder.classes_, range(len(encoder.classes_))))
    
    mfccs_path = self.repo.get_asset_path(voiceprint_id, MFCCS_FILENAME)
    labels_path = self.repo.get_asset_path(voiceprint_id, LABELS_FILENAME)
    label_mapping_path = self.repo.get_asset_path(voiceprint_id, LABEL_MAPPING_FILENAME)

    # Save files
    np.save(mfccs_path, processed_mfccs)
    np.save(labels_path, encoded_labels)
    np.save(label_mapping_path, label_mapping)

    self.logger.info(f"Extracted MFCCs for {len(processed_mfccs)} files of '{voiceprint_model.name}'")
  
  def train_model(self, voiceprint_id: str) -> None:
    """
    Train a voiceprint model using the MFCCs and labels stored
    """
    # Load data
    mfccs_path = self.repo.get_asset_path(voiceprint_id, MFCCS_FILENAME)
    labels_path = self.repo.get_asset_path(voiceprint_id, LABELS_FILENAME)

    mfccs = np.load(mfccs_path)
    labels = np.load(labels_path)

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
    # #######

    # Save scaler
    scaler_mean_path = self.repo.get_asset_path(voiceprint_id, SCALER_MEAN_FILENAME)
    scaler_scale_path = self.repo.get_asset_path(voiceprint_id, SCALER_SCALE_FILENAME)
    
    np.save(scaler_mean_path, scaler.mean_)
    np.save(scaler_scale_path, scaler.scale_)

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
    model_path = self.repo.get_asset_path(voiceprint_id, MODEL_FILENAME)
    model.save(model_path)
    self.logger.info(f"Model saved to '{model_path}'")
    
    # Save training history
    history_path = self.repo.get_asset_path(voiceprint_id, TRAINING_HISTORY_FILENAME)
    np.save(history_path, history.history)
    self.logger.info(f"Training history saved to '{history_path}'")

  def load_model(self, voiceprint_id: str) -> None:
    voiceprint_model = self.repo.get_voiceprint(voiceprint_id)
    if not voiceprint_model:
      self.logger.error(f"Voiceprint model not found: {voiceprint_id}")
      return None

    # Load the model
    model_path = self.repo.get_asset_path(voiceprint_id, MODEL_FILENAME)
    model: tf.keras.Model = tf.keras.models.load_model(model_path)

    # Load the labels
    # TODO: do we need this?
    labels_path = self.repo.get_asset_path(voiceprint_id, LABELS_FILENAME)
    labels_data = np.load(labels_path)
    encoder: LabelEncoder = LabelEncoder()
    encoder.fit(labels_data)
    self.logger.info(f"Labels loaded from {labels_path}.")

    # Load label mapping
    label_mapping_path = self.repo.get_asset_path(voiceprint_id, LABEL_MAPPING_FILENAME)
    label_mapping = np.load(label_mapping_path, allow_pickle=True).item()
    reverse_label_mapping: dict[Any, Any] = {v: k for k, v in label_mapping.items()}
    self.logger.info(f"Label mapping loaded from {label_mapping_path}.")

    # Load scaler parameters
    scaler_mean_path = self.repo.get_asset_path(voiceprint_id, SCALER_MEAN_FILENAME)
    scaler_scale_path = self.repo.get_asset_path(voiceprint_id, SCALER_SCALE_FILENAME)
    scaler_mean: np.ndarray = np.load(scaler_mean_path)
    scaler_scale: np.ndarray = np.load(scaler_scale_path)
    self.logger.info(f"Scaler parameters loaded from {scaler_mean_path} and {scaler_scale_path}.")

    self.loaded_parameters = LoadedParameters(
      voiceprint_id=voiceprint_id,
      model=model,
      scaler_mean=scaler_mean,
      scaler_scale=scaler_scale,
      reverse_label_mapping=reverse_label_mapping
    )

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
      if mfccs_flat.shape[1] == self.loaded_parameters.scaler_mean.shape[0]:
        mfccs_flat = (mfccs_flat - self.loaded_parameters.scaler_mean) / self.loaded_parameters.scaler_scale
        mfccs = mfccs_flat.reshape(mfccs.shape)
        self.logger.info("Scaling applied to input.")
      else:
        self.logger.warning(f"Warning: MFCC features shape {mfccs_flat.shape[1]} mismatch with scaler mean shape {self.loaded_parameters.scaler_mean.shape[0]}. Skipping scaling.")


      # Predict
      prediction_result = self.loaded_parameters.model.predict(mfccs, verbose=0)

      predicted_class_idx = np.argmax(prediction_result, axis=1)[0]
      confidence = float(prediction_result[0][predicted_class_idx])
      speaker_name = self.loaded_parameters.reverse_label_mapping.get(predicted_class_idx, "Unknown")

      all_predictions = {
          self.loaded_parameters.reverse_label_mapping.get(i, "Unknown"): float(conf)
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