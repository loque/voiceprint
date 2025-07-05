import tempfile
import os

from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware

from utils import get_logger
from voiceprint.voiceprint import Voiceprint, model

_LOGGER = get_logger("rest_api")

voiceprint = Voiceprint(model)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/speakers")
async def get_speakers():
    speakers = voiceprint.get_enrolled_speakers()
    _LOGGER.info("Enrolled speakers: %s", speakers)
    return {"speakers": speakers}

@app.post("/speakers/enroll")
async def enroll_speaker(
    name: str = Form(...),
    audio_files: list[UploadFile] = File(...)
):
    """Enroll a new speaker with their audio samples."""
    if not name or not name.strip():
        return {"error": "Please enter a valid speaker name."}
    
    if len(audio_files) < 5:
        return {"error": "Please provide at least 5 audio samples for enrollment."}
    
    temp_file_paths = []
    try:
        # Save uploaded files to temporary locations
        for audio_file in audio_files:
            if not audio_file.filename:
                return {"error": "All audio files must have valid filenames."}
            
            # Create a temporary file
            temp_fd, temp_path = tempfile.mkstemp(suffix=os.path.splitext(audio_file.filename)[1])
            temp_file_paths.append(temp_path)
            
            # Write the uploaded file content to the temporary file
            with os.fdopen(temp_fd, 'wb') as temp_file:
                content = await audio_file.read()
                temp_file.write(content)
        
        # Enroll the speaker using the temporary file paths
        voiceprint.enroll_speaker(name, temp_file_paths)
        return {"message": f"Successfully enrolled '{name}' with {len(audio_files)} voice samples!"}
    
    except Exception as e:
        _LOGGER.error("Error enrolling speaker: %s", str(e))
        return {"error": f"Error enrolling speaker: {str(e)}"}
    
    finally:
        # Clean up temporary files
        for temp_path in temp_file_paths:
            try:
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
            except Exception as cleanup_error:
                _LOGGER.warning("Failed to cleanup temporary file %s: %s", temp_path, cleanup_error)

@app.post("/speakers/identify")
async def identify_speaker(audio_file: UploadFile = File(...)):
    """Identify a speaker from an audio sample."""
    if not audio_file or not audio_file.filename:
        return {"error": "Please provide a valid audio file for identification."}

    if not voiceprint.get_enrolled_speakers():
        return {"error": "No speakers enrolled yet! Please enroll speakers first."}
    
    temp_path = None
    try:
        # Create a temporary file for the uploaded audio
        temp_fd, temp_path = tempfile.mkstemp(suffix=os.path.splitext(audio_file.filename)[1])
        
        # Write the uploaded file content to the temporary file
        with os.fdopen(temp_fd, 'wb') as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
        
        # Identify the speaker using the temporary file path
        identified_speaker = voiceprint.identify_speaker(temp_path)
        if identified_speaker:
            return {"identified_speaker": identified_speaker}
        else:
            return {"identified_speaker": "Unknown Speaker"}
            
    except Exception as e:
        _LOGGER.error("Error identifying speaker: %s", str(e))
        return {"error": f"Error identifying speaker: {str(e)}"}
    
    finally:
        # Clean up temporary file
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except Exception as cleanup_error:
                _LOGGER.warning("Failed to cleanup temporary file %s: %s", temp_path, cleanup_error)

@app.delete("/speakers/{speaker_name}")
async def delete_speakers(speaker_name: str):
    """Delete selected speakers."""
    if not speaker_name:
        return {"error": "No speaker selected for deletion."}
    
    try:
        voiceprint.unenroll_speaker(speaker_name)
        return {"message": f"Successfully deleted speaker '{speaker_name}'."}
    except Exception as e:
        _LOGGER.error("Error deleting speaker: %s", str(e))
        return {"error": f"Error deleting speaker: {str(e)}"}