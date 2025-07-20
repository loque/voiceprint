
import json
import os
from typing import NewType, TypedDict

from jsonschema import ValidationError, validate
import numpy as np

from voiceprint.helpers import sanitize_name


speaker_schema_path = os.path.join(os.path.dirname(__file__), "speaker_schema.json")
with open(speaker_schema_path, "r", encoding="utf-8") as f:
    speaker_schema = json.load(f)

SpeakerId = NewType("SpeakerId", str)

class SpeakerDTO(TypedDict):
    """Type definition for a speaker in the library."""
    id: SpeakerId
    name: str
    embeddings: np.ndarray

class Speaker:
    _id: SpeakerId
    _name: str
    _embeddings: np.ndarray

    @staticmethod
    def create(name: str, embeddings: np.ndarray) -> 'Speaker':
        """Create a new speaker."""
        if not name:
            raise ValueError("Speaker name cannot be empty")
        
        speaker = SpeakerDTO(
            id=SpeakerId(sanitize_name(name)),
            name=name,
            embeddings=embeddings
        )
        return Speaker(speaker)

    @staticmethod
    def from_dict(data: SpeakerDTO) -> 'Speaker':
        """Create a Speaker instance from a dictionary."""
        try:
            # We expect a dict with a list of numbers for embeddings, not a full SpeakerDTO
            validate(instance=data, schema=speaker_schema)
        except ValidationError as e:
            raise ValueError(f"Invalid speaker data format: {e.message}") from e

        # Convert embeddings from list to numpy array after validation
        data["embeddings"] = np.array(data["embeddings"])
        
        return Speaker(data)
    
    def __init__(self, speaker: SpeakerDTO):
        self._id = speaker['id']
        self._name = speaker['name']
        self._embeddings = speaker['embeddings']

    @property
    def id(self) -> SpeakerId:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def embeddings(self) -> np.ndarray:
        return self._embeddings
    
    def to_dict(self) -> dict:
        """Return the speaker as a dictionary suitable for JSON serialization."""
        speaker_dict = {
            'id': self._id,
            'name': self._name,
            'embeddings': self._embeddings
        }
        
        # Convert numpy array to list for JSON serialization
        if isinstance(speaker_dict['embeddings'], np.ndarray):
            speaker_dict['embeddings'] = speaker_dict['embeddings'].tolist()
            
        return speaker_dict