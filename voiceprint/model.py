import logging
import uuid
import os
import json
from typing import Dict, List
import librosa
import numpy as np
from sklearn.preprocessing import LabelEncoder

Voices = Dict[str, List[str]]

class Model:
  def __init__(self, name: str, voices: Voices, logger: logging.Logger, cwd: str):
      self.id = uuid.uuid4().hex[:8]
      self.dir = os.path.join(cwd, 'models', self.id)
      self.name = name
      self.voices = voices
      self.logger: logging.Logger = logger
      self.mfccs = None
      self.labels = None
      self.label_mapping = None
      self.scaler_mean = None
      self.scaler_scale = None
  
  def extract_mfccs(self, fixed_length: int = 100, n_mfcc: int = 13):
      """
      Extract MFCCs from the audio files in self.voices, save to self.dir, and populate self fields.
      """
      voices_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../voices'))
      os.makedirs(self.dir, exist_ok=True)
      mfcc_data = []
      labels = []
      for speaker, files in self.voices.items():
          for audio_file in files:
              if not audio_file.endswith(".wav"):
                  continue
              audio_path = os.path.join(voices_dir, speaker, audio_file)
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
      
      self.mfccs = os.path.join(self.dir, "mfccs.npy")
      self.labels = os.path.join(self.dir, "labels.npy")
      self.label_mapping = os.path.join(self.dir, "label_mapping.npy")
      
      # Save files
      np.save(self.mfccs, processed_mfccs)
      np.save(self.labels, encoded_labels)
      np.save(self.label_mapping, label_mapping)

      self.logger.info(f"Extracted MFCCs for {len(processed_mfccs)} files to {self.dir}")
  
  def saveMetadata(self):
      """
      Save model metadata (excluding logger and dir) to metadata.json in self.dir.
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
      with open(os.path.join(self.dir, "metadata.json"), "w") as f:
          json.dump(metadata, f, indent=2)
      self.logger.info(f"Saved metadata to {os.path.join(self.dir, 'metadata.json')}")
