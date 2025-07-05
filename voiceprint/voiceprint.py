import pickle
import os
from typing import Optional

import torchaudio
import torch
import numpy as np
from speechbrain.inference.speaker import SpeakerRecognition

from utils import get_logger

_LOGGER = get_logger("voiceprint")

# Get the absolute path to the model directory relative to this file
_current_dir = os.path.dirname(os.path.abspath(__file__))
_model_path = os.path.join(_current_dir, "models", "spkrec-ecapa-voxceleb")
_data_path = os.path.join(_current_dir, "data")

model = SpeakerRecognition.from_hparams(
    source=_model_path,
    savedir=_model_path,
    run_opts={"device":"cpu"},
)

class Voiceprint:
    def __init__(self, model: Optional[SpeakerRecognition] = None, db_path: Optional[str] = None):
        if model is None:
            raise ValueError("A valid SpeakerRecognition model must be provided.")
        self.model = model
        # name ➔ embedding (numpy array)
        self.db: dict[str, np.ndarray] = {}
        self._db_path = db_path or os.path.join(_data_path, "speakers.db")
        if os.path.isfile(self._db_path):
            _LOGGER.info("Loading existing speaker database from %s", self._db_path)
            self._load_speakers()
        else:
            _LOGGER.info("No existing speaker database found at %s, starting fresh", self._db_path)

    def enroll_speaker(self, name: str, audiofiles: list[str]):
        embeddings = []
        for wav in audiofiles:
            signal, fs = torchaudio.load(wav)
            # Resample & mono normalization done inside encode_batch if needed
            with torch.no_grad():
                emb = self.model.encode_batch(signal)  # (1, feat_dim, 1)
            # Convert to 1D numpy array
            emb = emb.squeeze().cpu().numpy()
            embeddings.append(emb)

        # Store mean embedding
        self.db[name] = np.mean(embeddings, axis=0)
        self._save_speakers()

    def get_enrolled_speakers(self) -> list[str]:
        return list(self.db.keys())

    def unenroll_speaker(self, name: str):
        self.db.pop(name, None)
        self._save_speakers()

    def identify_speaker(self, audiofile: str) -> Optional[str]:
        if not self.db:
            return None
        
        signal, fs = torchaudio.load(audiofile)
        with torch.no_grad():
            emb = self.model.encode_batch(signal).squeeze().cpu().numpy()

        # Compute cosine similarities
        sims = {
            name: np.dot(emb, ref) / (np.linalg.norm(emb) * np.linalg.norm(ref))
            for name, ref in self.db.items()
        }
        # Return best match
        return max(sims.keys(), key=lambda name: sims[name])

    def _save_speakers(self):
        with open(self._db_path, "wb") as f:
            pickle.dump(self.db, f)

    def _load_speakers(self):
        with open(self._db_path, "rb") as f:
            self.db = pickle.load(f)
