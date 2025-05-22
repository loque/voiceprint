import os
from flask import Blueprint, request, jsonify, current_app
from typing import List, Dict

models = Blueprint('models', __name__)

@models.route('', methods=['GET'])
def get_models():
  vp_service = current_app.config.get('VOICEPRINT_SERVICE')
  models = vp_service.get_voiceprints()
  # TODO: Conversion should be done in the service layer
  models_dicts = []
  for m in models:
    d = m.to_dict()
    d['isLoaded'] = getattr(m, 'isLoaded', False)
    models_dicts.append(d)
  return jsonify(models_dicts), 200

@models.route('', methods=['POST'])
def create_model():
  data = request.get_json()
  if not data or 'speakers' not in data or 'name' not in data:
    return jsonify({'error': 'Missing speakers or name in request body'}), 400

  model_speakers = data['speakers']
  model_name = data['name']

  vp_service = current_app.config.get('VOICEPRINT_SERVICE')
  
  try:
    model = vp_service.create_voiceprint(name=model_name, speakers=model_speakers)
    model.extract_mfccs()
    model.train_model()

    return jsonify({'message': 'Model created successfully', 'id': model.id}), 200
  except Exception as e:
    current_app.logger.error(f"Error during model creation: {e}", exc_info=True)
    return jsonify({'error': 'Failed to create model'}), 500

@models.route('/<model_id>', methods=['PUT'])
def load_model(model_id):
  try:
    vp_service = current_app.config.get('VOICEPRINT_SERVICE')
    vp_service.load_model(voiceprint_id=model_id)

    return jsonify({"message": "Model loaded successfully"}), 200
  except Exception as e:
    current_app.logger.error(f"Error loading model {model_id}: {e}", exc_info=True)
    return jsonify({"error": "Failed to load model"}), 500

@models.route('/<model_id>/identify', methods=['POST'])
def identify_voice(model_id):
  if 'file' not in request.files:
    return jsonify({"error": "No audio file part"}), 400
  
  # TODO: validate the model_id
  
  file = request.files['file']
  
  if file.filename == '':
    return jsonify({"error": "No selected file"}), 400
  
  temp_dir = os.path.join(current_app.instance_path, 'temp_uploads')
  os.makedirs(temp_dir, exist_ok=True)
  
  # Sanitize filename to prevent directory traversal or other attacks
  # Werkzeug's secure_filename is a good option if available, or implement basic sanitization.
  # For simplicity, we'll assume basic valid characters for now, but this should be robust.
  safe_filename = "".join(c for c in file.filename if c.isalnum() or c in ( '.', '-', '_'))
  if not safe_filename: # Handle empty or fully sanitized out filenames
    safe_filename = "uploaded_audio_file"
  temp_audio_path = os.path.join(temp_dir, safe_filename)
  
  try:
    file.save(temp_audio_path)
    current_app.logger.info(f"Temporary audio file saved to {temp_audio_path}")
    
    vp_service = current_app.config.get('VOICEPRINT_SERVICE')
    response = vp_service.identify(audio_file_path=temp_audio_path)
    
    if response.error:
      return jsonify({"error": response.error, "processing_time_ms": response.processing_time_ms}), 500
    
    return jsonify({
      "predicted_speaker": response.predicted_speaker,
      "confidence": response.confidence,
      "all_predictions": response.all_predictions,
      "processing_time_ms": response.processing_time_ms
    }), 200
  except Exception as e:
    current_app.logger.error(f"Error in identify endpoint: {e}", exc_info=True)
    return jsonify({"error": "An internal server error occurred"}), 500
  finally:
    # Clean up the temporary file
    if os.path.exists(temp_audio_path):
      try:
        os.remove(temp_audio_path)
        current_app.logger.info(f"Temporary audio file {temp_audio_path} removed.")
      except Exception as e:
        current_app.logger.error(f"Error removing temporary file {temp_audio_path}: {e}")