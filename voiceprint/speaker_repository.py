import os
from werkzeug.datastructures import FileStorage

from speaker_model import Speakers

class SpeakerRepository:
  def __init__(self, store_path: str):
    self.store_path = store_path
  
  def get_speakers_data(self, ) -> Speakers:
    if not os.path.exists(self.store_path):
      return []
    speakers: Speakers = {}
    for entry in os.listdir(self.store_path):
      entry_path = os.path.join(self.store_path, entry)
      if os.path.isdir(entry_path):
        wav_files = sorted([f for f in os.listdir(entry_path)
                            if os.path.isfile(os.path.join(entry_path, f)) and f.lower().endswith('.wav')])
        speakers[entry] = wav_files
    return speakers

  def add_speaker(self, speaker_name: str):
    speaker_path = os.path.join(self.store_path, speaker_name)
    os.makedirs(speaker_path, exist_ok=True)
      
  def add_speaker_sample(self, speaker_name: str, file: FileStorage):
    speaker_path = os.path.join(self.store_path, speaker_name)
    if not os.path.exists(speaker_path):
      raise FileNotFoundError(f"Speaker {speaker_name} does not exist.")
    
    file_path = os.path.join(speaker_path, file.filename)
    file.save(file_path)

  def delete_speaker_sample(self, speaker_name: str, sample_name: str):
      speaker_path = os.path.join(self.store_path, speaker_name)
      file_path = os.path.join(speaker_path, sample_name)
      if os.path.exists(file_path):
        os.remove(file_path)
  
  def get_sample_path(self, speaker_name: str, sample_name: str) -> str:
    speaker_path = os.path.join(self.store_path, speaker_name)
    file_path = os.path.join(speaker_path, sample_name)
    if os.path.exists(file_path):
      return file_path
    else:
      raise FileNotFoundError(f"Sample {sample_name} for speaker {speaker_name} does not exist.")