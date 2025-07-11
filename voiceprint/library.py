from datetime import datetime
from typing import List, NewType, TypedDict
import numpy as np

def _sanitize_name(name: str) -> str:
    """Convert name to valid Unix filename."""
    return name.replace(' ', '_').replace('-', '_').replace('/', '_').replace('\\', '_').lower()
    
SpeakerId = NewType("SpeakerId", str)
LibraryId = NewType("LibraryId", str)

class SpeakerDTO(TypedDict):
    """Type definition for a speaker in the library."""
    id: SpeakerId
    name: str
    embeddings: np.ndarray

class LibraryDTO(TypedDict):
    """Type definition for a library."""
    id: LibraryId
    name: str
    created_at: str
    speakers: List[SpeakerDTO]


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
            id=SpeakerId(_sanitize_name(name)),
            name=name,
            embeddings=embeddings
        )
        return Speaker(speaker)

    @staticmethod
    def from_dict(data: SpeakerDTO) -> 'Speaker':
        """Create a Speaker instance from a dictionary."""
        if not isinstance(data, dict):
            raise ValueError("Data must be a dictionary")
        
        if 'id' not in data or 'name' not in data or 'embeddings' not in data:
            raise ValueError("Invalid speaker data format")
        
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
    
    def to_dict(self) -> SpeakerDTO:
        """Return the speaker as a dictionary."""
        return {
            'id': self._id,
            'name': self._name,
            'embeddings': self._embeddings
        }

class Library:
    _id: LibraryId
    _name: str
    _created_at: str
    _speakers: List[Speaker]

    @staticmethod
    def create(name: str) -> 'Library':
        """Create a new voice library."""
        lib = LibraryDTO(
            id=LibraryId(_sanitize_name(name)),
            name=name,
            created_at=datetime.now().isoformat(),
            speakers=[]
        )
        return Library(lib)
    
    @staticmethod
    def from_dict(data: LibraryDTO) -> 'Library':
        """Create a Library instance from a dictionary."""
        if not isinstance(data, dict):
            raise ValueError("Data must be a dictionary")
        
        if 'id' not in data or 'name' not in data or 'created_at' not in data or 'speakers' not in data:
            raise ValueError("Invalid library data format")
        
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

    def to_dict(self) -> LibraryDTO:
        """Return the library as a dictionary."""
        return {
            'id': self._id,
            'name': self._name,
            'created_at': self._created_at,
            'speakers': [speaker.to_dict() for speaker in self._speakers]
        }