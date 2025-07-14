import tempfile
import os
from typing import List

from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import numpy as np
from pydantic import BaseModel

from rest_api.errors import BadRequestError, InternalServerError, NotFoundError
from utils import get_logger
from voiceprint.library import Library, LibraryDTO, LibraryId, SpeakerDTO, SpeakerId
from voiceprint.voiceprint import Voiceprint

_LOGGER = get_logger("rest_api")

api = FastAPI(title="Voiceprint Rest API")

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to hold the Voiceprint instance
voiceprint = None

def get_voiceprint() -> Voiceprint:
    """Get the Voiceprint instance, initializing it if necessary."""
    global voiceprint
    if voiceprint is None:
        libs_path = os.environ.get("LIBS_PATH", "/tmp/voiceprint_libs")
        voiceprint = Voiceprint(libs_path=libs_path)
    return voiceprint

class SpeakerIn(BaseModel):
    """API model for speaker input."""
    id: str
    name: str
    embeddings: List[float]

class LibraryIn(BaseModel):
    """API model for library input."""
    id: str
    name: str
    created_at: str
    speakers: List[SpeakerIn]

def library_in_to_dto(library_in: LibraryIn) -> LibraryDTO:
    """Convert LibraryIn (API model) to LibraryDTO (domain model)."""
    speakers_dto = []
    for speaker_in in library_in.speakers:
        speakers_dto.append(SpeakerDTO(
            id=SpeakerId(speaker_in.id),
            name=speaker_in.name,
            embeddings=np.array(speaker_in.embeddings)
        ))

    return LibraryDTO(
        id=LibraryId(library_in.id),
        name=library_in.name,
        created_at=library_in.created_at,
        speakers=speakers_dto
    )

class SpeakerOut(BaseModel):
    id: SpeakerId
    name: str

class LibraryOut(BaseModel):
    id: LibraryId
    name: str
    created_at: str
    speakers: List[SpeakerOut]


@api.get("/libraries", response_model=List[LibraryOut])
async def list_libraries():
    """Get a list of all available libraries."""
    libraries = get_voiceprint().list_libraries()
    return [lib.to_dict() for lib in libraries]

@api.post("/libraries", response_model=LibraryOut)
async def create_library(name: str):
    """Create a new library."""
    if not name or not name.strip():
        raise BadRequestError("Please enter a valid library name.")
    
    try:
        library = get_voiceprint().create_library(name)
        return library.to_dict()
    except Exception as e:
        _LOGGER.error("Error creating library: %s", str(e))
        raise InternalServerError("Error creating library.")

@api.post("/libraries/import", response_model=LibraryOut)
async def import_library(lib_file: UploadFile):
    """Import a library."""
    if not lib_file or not lib_file.filename:
        raise BadRequestError("Please provide a valid library file.")

    # Check file extension
    file_extension = os.path.splitext(lib_file.filename)[1].lower()
    if file_extension != '.pkl':
        raise BadRequestError("Only pickle (.pkl) files are supported for library import.")

    temp_path = None
    try:
        # Read the uploaded file content
        content = await lib_file.read()
        
        # Create a temporary file for the uploaded library
        temp_fd, temp_path = tempfile.mkstemp(suffix='.pkl')
        
        # Write the uploaded file content to the temporary file
        with os.fdopen(temp_fd, 'wb') as temp_file:
            temp_file.write(content)
        
        # Import the library using the temporary file path
        library = get_voiceprint().import_library(temp_path)
        return library.to_dict()
        
    except Exception as e:
        _LOGGER.error("Error importing library: %s", str(e))
        raise InternalServerError("Error importing library.")
    
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as cleanup_error:
                _LOGGER.warning("Failed to cleanup temporary file %s: %s", temp_path, cleanup_error)

@api.get("/libraries/{library_id}/file")
async def download_library(library_id: LibraryId):
    """Download a library by ID."""
    get_library(library_id)
        
    # Get the library file path
    library_file_path = get_voiceprint().get_library_path(library_id)
    if not os.path.exists(library_file_path):
        raise NotFoundError("Library file not found.")
    
    # Return the file as a download response
    filename = f"{library_id}.pkl"
    return FileResponse(
        path=library_file_path,
        filename=filename,
        media_type="application/octet-stream"
    )

def get_library(library_id: LibraryId) -> Library:
    """Get a library by ID."""
    if not library_id:
        raise BadRequestError("Library ID cannot be empty.")
    try:
        library = get_voiceprint().load_library(library_id)
        return library
    except:
        raise NotFoundError("Library not found.")

@api.delete("/libraries/{library_id}")
async def delete_library(library_id: LibraryId) -> str:
    """Delete a library by ID."""
    get_library(library_id)
    
    _LOGGER.info("Deleting library with ID: %s", library_id)
    
    try:
        get_voiceprint().delete_library(library_id)
        return "ok"
    except Exception as e:
        _LOGGER.error("Error deleting library: %s", str(e))
        raise InternalServerError("Error deleting library.")

@api.post("/libraries/{library_id}/speakers", response_model=SpeakerOut)
async def enroll_speaker(
    library_id: LibraryId,
    name: str,
    audio_files: list[UploadFile]
):
    """Enroll a new speaker with their audio samples."""
    get_library(library_id)
    
    if not name or not name.strip():
        raise BadRequestError("Please enter a valid speaker name.")

    if len(audio_files) < 5:
        raise BadRequestError("Please provide at least 5 audio samples for enrollment.")
    
    temp_file_paths = []
    try:
        # Save uploaded files to temporary locations
        for audio_file in audio_files:
            if not audio_file.filename:
                raise BadRequestError("All audio files must have valid filenames.")

            # Create a temporary file
            temp_fd, temp_path = tempfile.mkstemp(suffix=os.path.splitext(audio_file.filename)[1])
            temp_file_paths.append(temp_path)
            
            # Write the uploaded file content to the temporary file
            with os.fdopen(temp_fd, 'wb') as temp_file:
                content = await audio_file.read()
                temp_file.write(content)
        
        # Enroll the speaker using the temporary file paths
        return get_voiceprint().enroll_speaker(name, temp_file_paths)

    except Exception as e:
        _LOGGER.error("Error enrolling speaker: %s", str(e))
        raise InternalServerError("Error enrolling speaker.")

    finally:
        # Clean up temporary files
        for temp_path in temp_file_paths:
            try:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
            except Exception as cleanup_error:
                _LOGGER.warning("Failed to cleanup temporary file %s: %s", temp_path, cleanup_error)

class IdentifyResponse(BaseModel):
    speaker: SpeakerOut | None

@api.post("/libraries/{library_id}/identify", response_model=IdentifyResponse)
async def identify_speaker(library_id: LibraryId, audio_file: UploadFile):
    """Identify a speaker from an audio sample."""
    library = get_library(library_id)
    
    if not audio_file or not audio_file.filename:
        raise BadRequestError("Please provide a valid audio file for identification.")

    if not library.speakers:
        raise BadRequestError("No speakers enrolled yet! Please enroll speakers first.")
    
    temp_path = None
    try:
        # Create a temporary file for the uploaded audio
        temp_fd, temp_path = tempfile.mkstemp(suffix=os.path.splitext(audio_file.filename)[1])
        
        # Write the uploaded file content to the temporary file
        with os.fdopen(temp_fd, 'wb') as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
        
        # Identify the speaker using the temporary file path
        identified_speaker = get_voiceprint().identify_speaker(temp_path)
        return {"speaker": identified_speaker}

    except Exception as e:
        _LOGGER.error("Error identifying speaker: %s", str(e))
        raise InternalServerError("Error identifying speaker.")
    
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as cleanup_error:
                _LOGGER.warning("Failed to cleanup temporary file %s: %s", temp_path, cleanup_error)

@api.delete("/libraries/{library_id}/speakers/{speaker_id}")
async def delete_speaker(library_id: LibraryId, speaker_id: SpeakerId) -> str:
    """Delete a speaker by ID."""
    get_library(library_id)
    
    if not speaker_id:
        raise BadRequestError("No speaker selected for deletion.")

    try:
        if not get_voiceprint().unenroll_speaker(speaker_id):
            raise NotFoundError("Speaker not found.")
        return "ok"
    except Exception as e:
        _LOGGER.error("Error deleting speaker: %s", str(e))
        raise InternalServerError("Error deleting speaker.")