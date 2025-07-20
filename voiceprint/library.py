from datetime import datetime
from typing import List, NewType, TypedDict
import numpy as np
import json
import os
from jsonschema import validate, ValidationError

from voiceprint.helpers import sanitize_name
from voiceprint.speaker import Speaker, SpeakerDTO, SpeakerId

library_schema_path = os.path.join(os.path.dirname(__file__), "library_schema.json")
with open(library_schema_path, "r", encoding="utf-8") as f:
    library_schema = json.load(f)
    
LibraryId = NewType("LibraryId", str)

class LibraryDTO(TypedDict):
    """Type definition for a library."""
    id: LibraryId
    name: str
    created_at: str
    speakers: List[SpeakerDTO]

class Library:
    _id: LibraryId
    _name: str
    _created_at: str
    _speakers: List[Speaker]

    @staticmethod
    def create(name: str) -> 'Library':
        """Create a new voice library."""
        lib = LibraryDTO(
            id=LibraryId(sanitize_name(name)),
            name=name,
            created_at=datetime.now().isoformat(),
            speakers=[]
        )
        return Library(lib)
    
    @staticmethod
    def from_dict(data: LibraryDTO) -> 'Library':
        """Create a Library instance from a dictionary."""
        try:
            validate(instance=data, schema=library_schema)
        except ValidationError as e:
            raise ValueError(f"Invalid library data format: {e.message}") from e
        
        return Library(data)

    def __init__(self, lib: LibraryDTO):
        self._id = lib['id']
        self._name = lib['name']
        self._created_at = lib['created_at']
        self._speakers = [Speaker.from_dict(speaker) for speaker in lib['speakers']]

    @property
    def id(self) -> LibraryId:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def created_at(self) -> str:
        return self._created_at

    @property
    def speakers(self) -> List[Speaker]:
        return self._speakers
    
    def add_speaker(self, name: str, embeddings: np.ndarray) -> Speaker:
        """Add a speaker to the library."""
        speaker = Speaker.create(name, embeddings)

        if any(s.id == speaker.id for s in self._speakers):
            raise ValueError(f"Speaker with ID {speaker.id} already exists in the library")

        self._speakers.append(speaker)
        return speaker

    def remove_speaker(self, speaker_id: SpeakerId) -> bool:
        """Remove a speaker from the library."""
        for i, speaker in enumerate(self._speakers):
            if speaker.id == speaker_id:
                del self._speakers[i]
                return True
        return False

    def to_dict(self) -> dict:
        """Return the library as a dictionary suitable for JSON serialization."""
        return {
            'id': self._id,
            'name': self._name,
            'created_at': self._created_at,
            'speakers': [speaker.to_dict() for speaker in self._speakers]
        }