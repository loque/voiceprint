import io
import tempfile
import wave
from typing import Optional
import os

from wyoming.audio import AudioChunk
from wyoming.event import Event
from wyoming.server import AsyncEventHandler
from wyoming.asr import Transcript

from voiceprint.speaker import Speaker
from voiceprint.voiceprint import Voiceprint
from utils import get_logger

_LOGGER = get_logger("handler")

class WyomingEventHandler(AsyncEventHandler):
    """Handle Wyoming events for voiceprint speaker identification."""

    def __init__(self, *args, voiceprint: Voiceprint, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.voiceprint = voiceprint
        
        # Temporary audio files for accumulating audio chunks
        self.temp_file: Optional[tempfile._TemporaryFileWrapper[bytes]] = None
        self.wave_file: Optional[wave.Wave_write] = None

    async def handle_event(self, event: Event) -> bool:
        """Handle all Wyoming events."""
        
        if AudioChunk.is_type(event.type):
            await self._handle_audio_chunk(event)
        elif Transcript.is_type(event.type):
            await self._handle_transcript(event)
        else:
            _LOGGER.debug("Unhandled event [%s]: %s", event.type, event.data)

        return True

    async def _handle_audio_chunk(self, event: Event) -> None:
        """Accumulate audio chunks."""
        chunk = AudioChunk.from_event(event)

        if self.temp_file is None:
            self.temp_file = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
            self.wave_file = wave.open(self.temp_file.name, "wb")
            self.wave_file.setframerate(chunk.rate)
            self.wave_file.setsampwidth(chunk.width)
            self.wave_file.setnchannels(chunk.channels)

        if self.wave_file is None:
            _LOGGER.warning("No wave file initialized; cannot write audio chunk")
        else:
            self.wave_file.writeframes(chunk.audio)

    async def _handle_transcript(self, event: Event) -> None:
        """Trigger speaker identification on Transcript event."""
        
        speaker_id = self._identify_speaker_from_audio()
        
        if speaker_id:
            _LOGGER.info("Identified speaker: %s", speaker_id)
            
            # Add speaker_id to the transcript event
            next_data = dict(event.data) if event.data else {}
            ext_value = next_data.get("ext")
            if not ext_value or not isinstance(ext_value, dict):
                next_data["ext"] = {}
            next_data["ext"]["speaker_id"] = speaker_id
            
            # Create new event with speaker identification
            next_event = Event(type=event.type, data=next_data, payload=event.payload)
            await self.write_event(next_event)
        else:
            _LOGGER.warning("Could not identify speaker from audio")
            # Forward original event
            await self.write_event(event)

    def _get_file_path(self) -> str:
        """Get the path of the temporary file."""
        if self.temp_file is None:
            raise ValueError("Temporary file is missing")
        
        temp_file_path = self.temp_file.name
        self.temp_file.close()
        self.temp_file = None

        if self.wave_file:
            self.wave_file.close()
            self.wave_file = None

        return temp_file_path
    
    def _identify_speaker_from_audio(self) -> Optional[Speaker]:
        """Identify speaker from audio file."""
        try:
            file_path = self._get_file_path()
            speaker = self.voiceprint.identify_speaker(file_path)
            os.unlink(file_path)
            
            return speaker if speaker else None
                
        except Exception as e:
            _LOGGER.error("Error identifying speaker: %s", e)
            return None
