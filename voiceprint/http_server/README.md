# HTTP Server Endpoints

This document describes the available endpoints in the `server.py` file, their arguments, responses, and provides sample `curl` commands for testing.

## Endpoints

### Voices Endpoints

#### 1. **GET /voices**

**Description:**
Fetches a list of available voices. The voices are returned as a dictionary where the keys are voice names and the values are lists of `.wav` files.

**Response:**

- **200 OK**: Returns a JSON object of voices with the following structure:

**Sample Response:**

```json
{
  "lucas": ["file1.wav", "file2.wav"],
  "olivia": ["file3.wav"]
}
```

**Sample `curl` Command:**

```bash
curl -X GET http://localhost:5000/voices
```

---

#### 2. **POST /voices**

**Description:**
Adds a new voice by creating a directory for it.

**Request Body:**

```json
{
  "name": "lucas"
}
```

**Response:**

- **201 Created**: Voice added successfully.
- **400 Bad Request**: Missing voice name in the request body.

**Sample `curl` Command:**

```bash
curl -X POST http://localhost:5000/voices \
  -H "Content-Type: application/json" \
  -d '{"name": "lucas"}'
```

---

#### 3. **POST /voices/<voice_name>**

**Description:**
Adds a new voice sample to the specified voice.

**Request:**

- **Form Data:**
  - `file`: The audio file to be added.

**Response:**

- **201 Created**: Voice file added successfully.
- **400 Bad Request**: Missing or invalid file.

**Sample `curl` Command:**

```bash
curl -X POST http://localhost:5000/voices/lucas \
  -F "file=@path_to_audio_file.wav"
```

---

#### 4. **DELETE /voices/<voice_name>/<sample_name>**

**Description:**
Deletes a specific voice sample from the specified voice.

**Response:**

- **200 OK**: Voice file deleted successfully.
- **404 Not Found**: File not found.

**Sample `curl` Command:**

```bash
curl -X DELETE http://localhost:5000/voices/lucas/sample1.wav
```

---

### Models Endpoints

#### 1. **GET /models**

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
      "lucas": ["file1.wav", "file2.wav"],
      "olivia": ["file3.wav"]
    }
  },
  {
    "id": "model2",
    "name": "Model Two",
    "voices": {
      "ryan": ["file4.wav"],
      "amelia": ["file5.wav", "file6.wav"]
    }
  }
]
```

**Sample `curl` Command:**

```bash
curl -X GET http://localhost:5000/models
```

---

#### 2. **POST /models**

**Description:**
Creates a new model using the provided voices and name.

**Request Body:**

```json
{
  "voices": {
    "lucas": ["file1.wav", "file2.wav"],
    "olivia": ["file3.wav"]
  },
  "name": "Model Three"
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
  -d '{"voices": {"lucas": ["file1.wav", "file2.wav"], "olivia": ["file3.wav"]}, "name": "Model Three"}'
```

---

#### 3. **POST /models/<model_id>**

**Description:**
Loads a model by its ID.

**Response:**

- **200 OK**: Model loaded successfully.
- **500 Internal Server Error**: Failed to load the model.

**Sample `curl` Command:**

```bash
curl -X POST http://localhost:5000/models/<model_id>
```

---

#### 4. **POST /models/<model_id>/identify**

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
