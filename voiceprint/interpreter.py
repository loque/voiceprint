import os
import logging
import numpy as np
import tensorflow as tf
from sklearn.preprocessing import LabelEncoder
from typing import Any, Dict
import librosa
import time
from dataclasses import dataclass

class InterpreterConfig:
    def __init__(self,
                 model_dir_path: str | None = None,
                 model_filename: str | None = None,
                 labels_filename: str | None = None,
                 label_mapping_filename: str | None = None,
                 scaler_mean_filename: str | None = None,
                 scaler_scale_filename: str | None = None):
        self.model_dir_path: str = model_dir_path or os.getenv('MODEL_DIR_PATH', os.path.join(os.path.dirname(__file__), 'model')) # Adjusted default path
        self.model_filename: str = model_filename or os.getenv('MODEL_FILENAME', 'voiceprint_model.h5')
        self.labels_filename: str = labels_filename or os.getenv('LABELS_FILENAME', 'labels.npy')
        self.label_mapping_filename: str = label_mapping_filename or os.getenv('LABEL_MAPPING_FILENAME', 'label_mapping.npy')
        self.scaler_mean_filename: str = scaler_mean_filename or os.getenv('SCALER_MEAN_FILENAME', 'scaler_mean.npy')
        self.scaler_scale_filename: str = scaler_scale_filename or os.getenv('SCALER_SCALE_FILENAME', 'scaler_scale.npy')

@dataclass
class IdentifyResponse:
    predicted_speaker: str | None = None
    confidence: float | None = None
    all_predictions: Dict[str, float] | None = None
    processing_time_ms: float | None = None
    error: str | None = None

class Interpreter:
    def __init__(self, config: InterpreterConfig, logger: logging.Logger):
        self.logger: logging.Logger = logger
        self.logger.info("Initializing Interpreter and loading resources...")

        # Construct paths for resources
        actual_model_path = os.path.join(config.model_dir_path, config.model_filename)
        actual_labels_path = os.path.join(config.model_dir_path, config.labels_filename)
        actual_label_mapping_path = os.path.join(config.model_dir_path, config.label_mapping_filename)
        actual_scaler_mean_path = os.path.join(config.model_dir_path, config.scaler_mean_filename)
        actual_scaler_scale_path = os.path.join(config.model_dir_path, config.scaler_scale_filename)

        try:
            # Load the model
            if not os.path.exists(actual_model_path):
                self.logger.error(f"Error: Model file {actual_model_path} not found")
                raise RuntimeError(f"Model file {actual_model_path} not found")
            self.model: tf.keras.Model = tf.keras.models.load_model(actual_model_path)
            self.logger.info(f"Model loaded from {actual_model_path}.")

            # Load the labels
            if not os.path.exists(actual_labels_path):
                self.logger.error(f"Error: Labels file {actual_labels_path} not found")
                raise RuntimeError(f"Labels file {actual_labels_path} not found")
            labels_data = np.load(actual_labels_path)
            self.encoder: LabelEncoder = LabelEncoder()
            self.encoder.fit(labels_data)
            self.logger.info(f"Labels loaded from {actual_labels_path}.")

            # Load label mapping
            if not os.path.exists(actual_label_mapping_path):
                self.logger.error(f"Error: Label mapping file {actual_label_mapping_path} not found")
                raise RuntimeError(f"Label mapping file {actual_label_mapping_path} not found")
            label_mapping = np.load(actual_label_mapping_path, allow_pickle=True).item()
            self.reverse_label_mapping: dict[Any, Any] = {v: k for k, v in label_mapping.items()}
            self.logger.info(f"Label mapping loaded from {actual_label_mapping_path}.")

            # Load scaler parameters
            if not os.path.exists(actual_scaler_mean_path) or not os.path.exists(actual_scaler_scale_path):
                self.logger.error(f"Scaler files not found at specified paths: {actual_scaler_mean_path}, {actual_scaler_scale_path}")
                raise RuntimeError(f"Scaler files not found at {actual_scaler_mean_path} or {actual_scaler_scale_path}")
            self.scaler_mean: np.ndarray = np.load(actual_scaler_mean_path)
            self.scaler_scale: np.ndarray = np.load(actual_scaler_scale_path)
            self.logger.info(f"Scaler parameters loaded from {actual_scaler_mean_path} and {actual_scaler_scale_path}.")
            
            self.logger.info("Interpreter initialized and resources loaded successfully.")

        except Exception as e:
            self.logger.error(f"Failed to initialize Interpreter: {e}", exc_info=True)
            raise RuntimeError(f"Failed to initialize Interpreter: {e}")


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
