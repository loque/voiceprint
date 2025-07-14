# Wyoming Voiceprint Service

This service implements a Wyoming protocol wrapper around the voiceprint speaker identification system. It acts as a TTS (Text-to-Speech) service that adds speaker identification capabilities to transcripts.

## Features

- **Audio Stream Processing**: Listens for AudioStart, AudioChunk, and AudioStop events to accumulate audio data
- **Speaker Identification**: Processes Transcript events to identify speakers from the accumulated audio
- **Speaker Database**: Uses a speakers.db file to store enrolled speaker embeddings
- **Wyoming Protocol Compliance**: Follows the Wyoming peer-to-peer voice assistant protocol

## Usage

### Command Line

```bash
python -m wyoming_voiceprint --speakers-db /path/to/speakers.db --uri tcp://0.0.0.0:9002
```

### Arguments

- `--speakers-db`: **Required**. Path to the speakers database file (speakers.db)
- `--uri`: Wyoming service URI (default: `tcp://0.0.0.0:9002`)

### Example

```bash
# Start the service with a specific speakers database
python -m wyoming_voiceprint --speakers-db ./voiceprint/data/speakers.db --uri tcp://localhost:9002
```

## Protocol Flow

The service handles the following Wyoming event sequence:

1. **AudioStart**: Initializes audio buffer and records audio parameters
2. **AudioChunk**: Accumulates raw PCM audio data
3. **AudioStop**: Marks end of audio stream
4. **Transcript**: Triggers speaker identification and adds `speaker_id` to the transcript

### Event Processing

#### Audio Events

- `audio-start`: Prepares for audio data collection
- `audio-chunk`: Stores incoming PCM audio data
- `audio-stop`: Finalizes audio collection

#### Transcript Events

- `transcript`: Identifies speaker from accumulated audio and enriches the event with `speaker_id`

#### Output Format

When a transcript is processed, the service adds speaker identification to the event:

```json
{
  "type": "transcript",
  "data": {
    "text": "Hello, how are you?",
    "ext": {
      "speaker_id": "john_doe"
    }
  }
}
```

## Requirements

- Wyoming protocol library
- Voiceprint library with SpeakerRecognition model
- PyTorch and torchaudio
- NumPy

## Architecture

```
Wyoming Client -> AudioStart/AudioChunk/AudioStop -> Wyoming Voiceprint Service
                                                           |
                                                           v
Wyoming Client <- Transcript (with speaker_id) <- Speaker Identification
```

## Error Handling

- Missing audio data: Logs warning and forwards original transcript
- Speaker identification failure: Logs error and forwards original transcript
- Invalid audio parameters: Logs error and skips identification

## Logging

The service provides detailed logging for:

- Service initialization
- Enrolled speakers list
- Audio stream events
- Speaker identification results
- Error conditions

## Testing

Use the included test script to verify functionality:

```bash
python wyoming_voiceprint/test_service.py
```

This generates sample audio and shows the expected Wyoming protocol event flow.
