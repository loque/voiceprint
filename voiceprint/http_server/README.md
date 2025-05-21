# HTTP Server Endpoints

This document describes the available endpoints in the `server.py` file, their arguments, responses, and provides sample `curl` commands for testing.

## Endpoints

### 1. **GET /models**

**Description:**
Fetches a list of available models. Each model includes only the `id`, `name`, and `voices` fields.

**Response:**
- **200 OK**: Returns a JSON array of models with the following structure:

**Sample Response:**
```json
[
  {
    "id": "model1",
    "name": "Model One",
    "voices": {
      "voice1": ["file1.wav", "file2.wav"],
      "voice2": ["file3.wav"]
    }
  },
  {
    "id": "model2",
    "name": "Model Two",
    "voices": {
      "voice3": ["file4.wav"],
      "voice4": ["file5.wav", "file6.wav"]
    }
  }
]
```

**Sample `curl` Command:**
```bash
curl -X GET http://localhost:5000/models
```

---

### 2. **POST /models**

**Description:**
Creates a new model using the provided voices and name.

**Request Body:**
```json
{
  "voices": {
    "voice1": ["file1.wav", "file2.wav"],
    "voice2": ["file3.wav"]
  },
  "name": "model_name"
}
```

**Response:**
- **200 OK**: Model created successfully.
- **400 Bad Request**: Missing voices or name in the request body.
- **500 Internal Server Error**: Failed to create the model.

**Sample `curl` Command:**
```bash
curl -X POST http://localhost:5000/models \
  -H "Content-Type: application/json" \
  -d '{"voices": {"voice1": ["file1.wav", "file2.wav"], "voice2": ["file3.wav"]}, "name": "model_name"}'
```

---

### 3. **GET /voices**

**Description:**
Fetches a list of available voices. The voices are returned as a dictionary where the keys are voice names and the values are lists of `.wav` files.

**Response:**
- **200 OK**: Returns a JSON object of voices with the following structure:

**Sample Response:**
```json
{
  "voice1": ["file1.wav", "file2.wav"],
  "voice2": ["file3.wav"]
}
```

**Sample `curl` Command:**
```bash
curl -X GET http://localhost:5000/voices
```

---

### 4. **POST /models/<model_id>**

**Description:**
Selects a model by its ID.

**Response:**
- **200 OK**: Model selected successfully.
- **500 Internal Server Error**: Failed to load the model.

**Sample `curl` Command:**
```bash
curl -X POST http://localhost:5000/models/<model_id>
```

---

### 5. **POST /models/<model_id>/identify**

**Description:**
Identifies the speaker in the provided audio file using the specified model.

**Request:**
- **Form Data:**
  - `audio_file`: The audio file to be analyzed.

**Response:**
- **200 OK**: Returns the predicted speaker and confidence.
- **400 Bad Request**: Missing or invalid audio file.
- **500 Internal Server Error**: An error occurred during processing.

**Sample Response:**
```json
{
  "all_predictions": {
    "lucas": 0.0835234671831131,
    "olivia": 0.10214491188526154,
    "ryan": 0.8143316507339478
  },
  "confidence": 0.8143316507339478,
  "predicted_speaker": "ryan",
  "processing_time_ms": 128.29262299783295
}
```

**Sample `curl` Command:**
```bash
curl -X POST http://localhost:5000/models/<model_id>/identify \
  -F "audio_file=@path_to_audio_file.wav"
```
