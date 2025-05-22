from werkzeug.datastructures import FileStorage

from speaker_model import Speakers
from speaker_repository import SpeakerRepository

class SpeakerService:
  def __init__(self, repository: SpeakerRepository):
    self.repository = repository

  def get_speakers(self) -> Speakers:
    return self.repository.get_speakers_data()

  def add_speaker(self, speaker_name: str):
    self.repository.add_speaker(speaker_name)

  def add_speaker_sample(self, speaker_name: str, file: FileStorage):
    self.repository.add_speaker_sample(speaker_name, file)

  def delete_speaker_sample(self, speaker_name: str, sample_name: str):
    self.repository.delete_speaker_sample(speaker_name, sample_name)
