import uuid

from speaker_model import Speakers

class VoiceprintModel:
  def __init__(self, name: str, speakers: Speakers, id: str = None):
    self.id = id or uuid.uuid4().hex[:8]
    self.name = name
    self.speakers = speakers

  def to_dict(self):
    return {
      "id": self.id,
      "name": self.name,
      "speakers": self.speakers
    }