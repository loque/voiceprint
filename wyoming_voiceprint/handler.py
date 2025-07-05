import io
import tempfile
import wave
from typing import Optional

from wyoming.audio import AudioChunk, AudioStart, AudioStop
from wyoming.event import Event
from wyoming.server import AsyncEventHandler
from wyoming.asr import Transcript
from wyoming.tts import Synthesize

from voiceprint.voiceprint import Voiceprint
from utils import get_logger

_LOGGER = get_logger("handler")

class WyomingEventHandler(AsyncEventHandler):
    """Handle Wyoming events for voiceprint speaker identification."""

    def __init__(self, *args, voiceprint: Voiceprint, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.voiceprint = voiceprint
        
        # Audio accumulation state
        self.audio_buffer = io.BytesIO()
        self.audio_params = None
        self.is_recording = False
        
        _LOGGER.info("Initialized voiceprint handler")
        _LOGGER.info("Enrolled speakers: %s", self.voiceprint.get_enrolled_speakers())

    async def handle_event(self, event: Event) -> bool:
        """Handle all Wyoming events."""
        
        if AudioStart.is_type(event.type):
            await self._handle_audio_start(event)
        elif AudioChunk.is_type(event.type):
            await self._handle_audio_chunk(event)
        elif AudioStop.is_type(event.type):
            await self._handle_audio_stop(event)
        elif Transcript.is_type(event.type):
            await self._handle_transcript(event)
        else:
            _LOGGER.debug("Unhandled event [%s]: %s", event.type, event.data)

        return True

    async def _handle_audio_start(self, event: Event) -> None:
        """Handle audio stream start."""
        _LOGGER.info("Audio stream started")
        self.audio_buffer = io.BytesIO()
        self.audio_params = event.data
        self.is_recording = True

    async def _handle_audio_chunk(self, event: Event) -> None:
        """Accumulate audio chunks."""
        if self.is_recording and event.payload:
            self.audio_buffer.write(event.payload)

    async def _handle_audio_stop(self, event: Event) -> None:
        """Handle audio stream end."""
        _LOGGER.info("Audio stream stopped")
        self.is_recording = False

    async def _handle_transcript(self, event: Event) -> None:
        """Handle transcript event and trigger speaker identification."""
        transcript_text = event.data.get("text", "") if event.data else ""
        _LOGGER.info("Received transcript: %s", transcript_text)
        
        if not self.audio_buffer.getvalue():
            _LOGGER.warning("No audio data available for speaker identification")
            return
            
        # Identify speaker from accumulated audio
        speaker_id = await self._identify_speaker_from_audio()
        
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

    async def _identify_speaker_from_audio(self) -> Optional[str]:
        """Identify speaker from accumulated audio buffer."""
        try:
            if not self.audio_params or not self.audio_buffer.getvalue():
                return None
                
            # Create temporary WAV file from audio buffer
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                # Write WAV header and audio data
                with wave.open(temp_file.name, 'wb') as wav_file:
                    wav_file.setnchannels(self.audio_params.get("channels", 1))
                    wav_file.setsampwidth(self.audio_params.get("width", 2))
                    wav_file.setframerate(self.audio_params.get("rate", 16000))
                    wav_file.writeframes(self.audio_buffer.getvalue())
                
                # Identify speaker using voiceprint
                speaker_id = self.voiceprint.identify_speaker(temp_file.name)
                
                # Clean up temporary file
                import os
                os.unlink(temp_file.name)
                
                return speaker_id
                
        except Exception as e:
            _LOGGER.error("Error identifying speaker: %s", e)
            return None
