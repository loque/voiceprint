import pickle
import os
from typing import List, Optional

import torchaudio
import torch
import numpy as np
from speechbrain.inference.speaker import SpeakerRecognition

from utils import get_logger
from voiceprint.library import Library, LibraryDTO, LibraryId, Speaker, SpeakerId

_LOGGER = get_logger("voiceprint")

# Get the absolute path to the model directory relative to this file
_current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(_current_dir, "models", "spkrec-ecapa-voxceleb")
default_libs_path = os.path.join(_current_dir, "libs")
class Voiceprint:
    model: SpeakerRecognition
    library: Optional[Library]
    libs_path: str

    def __init__(self, libs_path: str = default_libs_path):
        model = SpeakerRecognition.from_hparams(
            source=model_path,
            savedir=model_path,
            run_opts={"device":"cpu"},
        )
        if model is None:
            raise RuntimeError("Failed to load the speaker recognition model")
        
        self.model = model
        self.libs_path = libs_path
        self.library: Optional[Library] = None
        
        # Ensure the libraries directory exists
        os.makedirs(self.libs_path, exist_ok=True)
    
    def get_library_path(self, lib_id: LibraryId) -> str:
        """Get the file path for a library by its ID."""
        return os.path.join(self.libs_path, f"{lib_id}.pkl")

    def _read_library_from_path(self, lib_path: str) -> Library:
        """Read a library from a specific file path. Raises exceptions on failure."""
        if not os.path.exists(lib_path):
            raise FileNotFoundError(f"Library file not found: {lib_path}")
        
        try:
            with open(lib_path, "rb") as f:
                library_data = pickle.load(f)

            library = Library.from_dict(library_data)
            if not isinstance(library, Library):
                raise ValueError("Read data is not a valid Library instance")

            _LOGGER.info(f"Read library: {library.name} (ID: {library.id})")
            return library
        except Exception as e:
            _LOGGER.error(f"Failed to read library from {lib_path}: {e}")
            raise

    def _read_library_by_id(self, lib_id: LibraryId) -> Library:
        """Read a library from file by its ID. Raises exceptions on failure."""
        if not lib_id:
            raise ValueError("Library ID cannot be empty")
        
        lib_path = self.get_library_path(lib_id)
        return self._read_library_from_path(lib_path)
    
    def _validate_library_loaded(self, expected_id: Optional[LibraryId] = None) -> Library:
        """Ensure a library is loaded before performing operations."""
        if self.library is None:
            raise ValueError("No voices library loaded. Create or load a library first.")
        
        if expected_id is not None and self.library.id != expected_id:
            raise ValueError(f"Expected library '{expected_id}' but '{self.library.id}' is loaded")
        
        return self.library
    
    def _write_library(self) -> None:
        """Save the library to file."""
        library = self._validate_library_loaded()

        lib_path = self.get_library_path(library.id)

        try:
            with open(lib_path, "wb") as f:
                pickle.dump(library.to_dict(), f)
            _LOGGER.info(f"Saved library to: {lib_path}")
        except Exception as e:
            raise ValueError(f"Failed to save library: {e}")
        
    def create_library(self, lib_name: str) -> Library:
        """Create a new library."""
        if not lib_name:
            raise ValueError("Library name cannot be empty")
        
        self.library = Library.create(lib_name)
        self._write_library()

        _LOGGER.info(f"Created new library: {lib_name} (ID: {self.library.id})")

        return self.library
    
    def import_library(self, lib_file_path: str) -> Library:
        """Import a library from a pickle file."""
        if not lib_file_path:
            raise ValueError("Library file path cannot be empty")
        
        if not os.path.exists(lib_file_path):
            raise FileNotFoundError(f"Library file not found: {lib_file_path}")
        
        if not lib_file_path.endswith('.pkl'):
            raise ValueError("Library file must be a pickle (.pkl) file")
        
        try:
            with open(lib_file_path, "rb") as f:
                library_data = pickle.load(f)
            
            self.library = Library.from_dict(library_data)
            self._write_library()

            _LOGGER.info(f"Imported library: {self.library.name} (ID: {self.library.id})")

            return self.library
        except Exception as e:
            _LOGGER.error(f"Failed to import library from {lib_file_path}: {e}")
            raise ValueError(f"Failed to import library: {e}")

    def list_libraries(self) -> List[Library]:
        """List all available libraries."""
        if not os.path.exists(self.libs_path):
            return []
        
        libraries: List[Library] = []
        for filename in os.listdir(self.libs_path):
            _LOGGER.debug(f"Checking file: {filename}")
            if filename.endswith(".pkl"):
                lib_id = LibraryId(filename[:-4])  # Remove .pkl extension
                try:
                    library = self._read_library_by_id(lib_id)
                    libraries.append(library)
                except Exception as e:
                    _LOGGER.warning(f"Failed to read library {lib_id}: {e}")
                    continue

        return libraries

    def load_library(self, lib_id: LibraryId) -> Library:
        """Load a library from file using library ID."""
        if self.library and self.library.id == lib_id:
            _LOGGER.info(f"Library {lib_id} is already loaded")
            return self.library
        
        try:
            self.library = self._read_library_by_id(lib_id)
            _LOGGER.info(f"Loaded voices library: {self.library.name} (ID: {self.library.id})")
            return self.library
        except Exception as e:
            raise ValueError(f"Failed to load library: {e}")
    
    
    def get_loaded_library(self) -> Optional[Library]:
        """Get the current voices library."""
        return self.library

    def delete_library(self, lib_id: LibraryId) -> bool:
        """Delete a library by its ID."""
        if not lib_id:
            raise ValueError("Library ID cannot be empty")
        
        lib_path = self.get_library_path(lib_id)
        
        if not os.path.exists(lib_path):
            _LOGGER.warning(f"Library file not found for deletion: {lib_path}")
            return False
        
        try:
            os.remove(lib_path)
            _LOGGER.info(f"Deleted library: {lib_id}")
            if self.library and self.library.id == lib_id:
                self.library = None  # Clear current library if it was deleted
            return True
        except Exception as e:
            _LOGGER.error(f"Failed to delete library {lib_id}: {e}")
            return False

    def enroll_speaker(self, name: str, audiofiles: list[str]) -> Speaker:
        """Enroll a speaker in the voices library."""
        library = self._validate_library_loaded()
        
        if not name:
            raise ValueError("Speaker name cannot be empty")
        
        if not audiofiles:
            raise ValueError("At least one audio file must be provided")
        
        # Process audio files to extract embeddings
        embeddings = []
        for wav in audiofiles:
            if not os.path.exists(wav):
                raise FileNotFoundError(f"Audio file not found: {wav}")
            
            signal, fs = torchaudio.load(wav)
            # Resample & mono normalization done inside encode_batch if needed
            with torch.no_grad():
                emb = self.model.encode_batch(signal)  # (1, feat_dim, 1)
            # Convert to 1D numpy array
            emb = emb.squeeze().cpu().numpy()
            embeddings.append(emb)

        # Store mean embedding
        mean_embedding = np.mean(embeddings, axis=0)
        
        # Create a speaker in library
        speaker = library.add_speaker(name, mean_embedding)
        self._write_library()
        
        _LOGGER.info(f"Enrolled speaker '{name}' with ID: {speaker.id}")
        return speaker

    def unenroll_speaker(self, speaker_id: SpeakerId) -> bool:
        """Remove a speaker from the voices library."""
        library = self._validate_library_loaded()
        
        if library.remove_speaker(speaker_id):
            _LOGGER.info(f"Unenrolled speaker by ID: {speaker_id}")
            self._write_library()
            return True
        return False

    def identify_speaker(self, audiofile: str) -> Optional[Speaker]:
        """Identify a speaker from an audio file."""
        library = self._validate_library_loaded()
        
        if not library.speakers:
            return None
        
        if not os.path.exists(audiofile):
            raise FileNotFoundError(f"Audio file not found: {audiofile}")
        
        signal, fs = torchaudio.load(audiofile)
        with torch.no_grad():
            emb = self.model.encode_batch(signal).squeeze().cpu().numpy()

        # Compute cosine similarities
        best_speaker: Optional[Speaker] = None
        best_similarity = -1
        
        for speaker in library.speakers:
            similarity = np.dot(emb, speaker.embeddings) / (
                np.linalg.norm(emb) * np.linalg.norm(speaker.embeddings)
            )
            if similarity > best_similarity:
                best_similarity = similarity
                best_speaker = speaker
        
        if best_speaker is None:
            _LOGGER.warning("No speaker identified from the audio file")
            return None

        return best_speaker