import json
import os
import shutil

from voiceprint_model import VoiceprintModel

class VoiceprintRepository:
  def __init__(self, store_path: str):
    self.store_path = store_path

  def add_voiceprint(self, voiceprint_model: VoiceprintModel):
    voiceprint_path = os.path.join(self.store_path, voiceprint_model.id)
    os.makedirs(voiceprint_path, exist_ok=True)

    with open(os.path.join(voiceprint_path, "metadata.json"), "w") as f:
      json.dump(voiceprint_model.to_dict(), f)
  
  def get_voiceprints(self):
    if not os.path.exists(self.store_path):
      return []

    voiceprints = []
    for entry in os.listdir(self.store_path):
      entry_path = os.path.join(self.store_path, entry)
      if os.path.isdir(entry_path):
        try:
          with open(os.path.join(entry_path, "metadata.json"), "r") as f:
            data = json.load(f)
            voiceprints.append(VoiceprintModel(**data))
        except FileNotFoundError:
          continue
    return voiceprints

  def get_voiceprint(self, voiceprint_id: str) -> VoiceprintModel:
    voiceprint_path = os.path.join(self.store_path, voiceprint_id)
    if not os.path.exists(voiceprint_path):
      return None
    
    try:
      with open(os.path.join(voiceprint_path, "metadata.json"), "r") as f:
        data = json.load(f)
        return VoiceprintModel(**data)
    except FileNotFoundError:
      return None

  def delete_voiceprint(self, voiceprint_id: str):
    dir_path = os.path.join(self.store_path, voiceprint_id)

    try:
      shutil.rmtree(dir_path)
    except FileNotFoundError:
      pass

  def get_asset_path(self, voiceprint_id: str, asset_name: str) -> str:
    voiceprint_path = os.path.join(self.store_path, voiceprint_id)
    os.makedirs(voiceprint_path, exist_ok=True)

    return os.path.join(voiceprint_path, asset_name)