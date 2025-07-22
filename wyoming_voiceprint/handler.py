import wave
from typing import Optional
import os

from wyoming.audio import AudioStart, AudioChunk
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

        _LOGGER.info("WyomingEventHandler initialized with Voiceprint instance")

        # Directory to accumulate audio samples
        self._sample_dir = os.path.join("/tmp", "acc")
        os.makedirs(self._sample_dir, exist_ok=True)

        # Audio file for accumulating audio chunks
        self._sample_path = os.path.join(self._sample_dir, "sample.wav")
        self._sample_file: Optional[wave.Wave_write] = None

    async def handle_event(self, event: Event) -> bool:
        """Handle all Wyoming events."""

        if AudioStart.is_type(event.type):
            await self._handle_audio_start(event)
        elif AudioChunk.is_type(event.type):
            await self._handle_audio_chunk(event)
        elif Transcript.is_type(event.type):
            await self._handle_transcript(event)
        else:
            _LOGGER.info("Unhandled event [%s]: %s", event.type, event.data)

        return True
    
    async def _handle_audio_start(self, event: Event) -> None:
        """Initialize audio sample accumulation."""
        _LOGGER.info("Audio start event received, resetting speaker_id")
        
        next_event = self._set_speaker_id(event, "unknown")
        await self.write_event(next_event)

    async def _handle_audio_chunk(self, event: Event) -> None:
        """Accumulate audio chunks."""
        chunk = AudioChunk.from_event(event)

        if self._sample_file is None:
            self._sample_file = wave.open(self._sample_path, "wb")
            self._sample_file.setframerate(chunk.rate)
            self._sample_file.setsampwidth(chunk.width)
            self._sample_file.setnchannels(chunk.channels)

        self._sample_file.writeframes(chunk.audio)

    async def _handle_transcript(self, event: Event) -> None:
        """Trigger speaker identification on Transcript event."""
        
        speaker = self._identify_speaker_from_audio()
        
        if speaker:
            _LOGGER.info("Identified speaker: %s", speaker.name)
            
            # Create new event with with the identified speaker
            next_event = self._set_speaker_id(event, speaker.id)
            await self.write_event(next_event)
        else:
            _LOGGER.warning("Could not identify speaker from audio")
            # Forward original event
            await self.write_event(event)
    
    def _set_speaker_id(self, event: Event, speaker_id: str) -> Event:
        """Clone an event with a new speaker_id in the ext field."""
        next_data = dict(event.data) if event.data else {}
        ext_value = next_data.get("ext")
        if not ext_value or not isinstance(ext_value, dict):
            next_data["ext"] = {}
        next_data["ext"]["speaker_id"] = speaker_id

        return Event(type=event.type, data=next_data, payload=event.payload)

    def _identify_speaker_from_audio(self) -> Optional[Speaker]:
        """Identify speaker from audio file."""
        try:
            if self._sample_file is not None:
                _LOGGER.warning("Audio file is still open. Closing it now.")
                self._sample_file.close()
                self._sample_file = None

            speaker = self.voiceprint.identify_speaker(self._sample_path)
            
            return speaker if speaker else None
                
        except Exception as e:
            _LOGGER.error("Error identifying speaker: %s", e)
            return None
