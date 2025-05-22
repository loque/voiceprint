import os
import logging
from flask import Flask, send_from_directory
from flask_cors import CORS

from speaker_repository import SpeakerRepository
from speaker_service import SpeakerService
from voiceprint_repository import VoiceprintRepository
from voiceprint_service import VoiceprintService

# Suppress TensorFlow logging early
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # FATAL
logging.getLogger('tensorflow').setLevel(logging.FATAL)

# TODO: do these validations in the repository
def is_valid_path(path: str) -> bool:
  """Check if the path exists and is writable."""
  if not os.path.exists(path):
    raise FileNotFoundError(f"Path {path} does not exist.")
  if not os.path.isdir(path):
    raise NotADirectoryError(f"Path {path} is not a directory.")
  if not os.access(path, os.W_OK):
    raise PermissionError(f"Path {path} is not writable.")
  if not os.access(path, os.R_OK):
    raise PermissionError(f"Path {path} is not readable.")
  return True

def create_app():
  app = Flask(__name__)
  CORS(app)

  # Configure logging
  app.logger.setLevel(logging.INFO)
  stream_handler = logging.StreamHandler()
  stream_handler.setFormatter(logging.Formatter(
      '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
  app.logger.addHandler(stream_handler)

  # Prepare Speaker Service
  speakers_path = os.getenv('SPEAKERS_PATH')
  is_valid_path(speakers_path)
  speaker_repository = SpeakerRepository(store_path=speakers_path)
  speaker_service = SpeakerService(repository=speaker_repository)
  app.config['SPEAKER_SERVICE'] = speaker_service

  # Prepare Voiceprint Service
  models_path = os.getenv('MODELS_PATH')
  is_valid_path(models_path)
  voiceprint_repository = VoiceprintRepository(store_path=models_path)
  voiceprint_service = VoiceprintService(repo=voiceprint_repository, speakers_repo=speaker_repository, logger=app.logger)
  app.config['VOICEPRINT_SERVICE'] = voiceprint_service

  @app.route('/samples/<path:path>')
  def send_sample(path):
    return send_from_directory('../speakers', path)

  from .speakers import speakers
  app.register_blueprint(speakers, url_prefix='/speakers')
  
  from .models import models
  app.register_blueprint(models, url_prefix='/models')

  return app

if __name__ == "__main__":
  app = create_app()
  port = int(os.environ.get("PORT", 5000))
  app.run(host='0.0.0.0', port=port, debug=True)