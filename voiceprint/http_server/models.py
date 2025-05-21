import os
from flask import Blueprint, request, jsonify, current_app
import json
from model_service import ModelService
from typing import List, Dict

models = Blueprint('models', __name__)

# TODO: share with ModelService
class Voices(Dict[str, List[str]]):
    pass

MODELS_PATH = os.getenv('MODELS_PATH')

@models.route('', methods=['GET'])
def get_models():
    # TODO: add property `isLoaded` to model
    models: List[Dict[str, object]] = []
    if not os.path.exists(MODELS_PATH):
        return jsonify(models), 200
    for entry in os.listdir(MODELS_PATH):
        entry_path = os.path.join(MODELS_PATH, entry)
        if os.path.isdir(entry_path):
            model_json_path = os.path.join(entry_path, 'metadata.json')
            if os.path.isfile(model_json_path):
                try:
                    with open(model_json_path, 'r') as f:
                        model_data = json.load(f)
                        filtered_data = {
                            "id": model_data.get("id"),
                            "name": model_data.get("name"),
                            "voices": Voices(model_data.get("voices", {}))
                        }
                        models.append(filtered_data)
                except Exception as e:
                    current_app.logger.error(f"Error reading {model_json_path}: {e}")
    return jsonify(models), 200

@models.route('', methods=['POST'])
def create_model():
    data = request.get_json()
    if not data or 'voices' not in data or 'name' not in data:
        return jsonify({'error': 'Missing voices or name in request body'}), 400

    model_voices = data['voices']
    model_name = data['name']
    
    # Instantiate the Model class
    logger = current_app.logger
    model = ModelService.create(name=model_name, voices=model_voices, logger=logger, cwd=MODELS_PATH)
    
    try:
        # Extract MFCCs, train the model, and save metadata
        model.extract_mfccs()
        model.train()
        model.saveMetadata()

        return jsonify({'message': 'Model created successfully', 'id': model.id}), 200
    except Exception as e:
        logger.error(f"Error during model creation: {e}", exc_info=True)
        return jsonify({'error': 'Failed to create model'}), 500

@models.route('/<model_id>', methods=['PUT'])
def load_model(model_id):
    try:
        current_app.config['MODEL_SERVICE'] = ModelService.load(model_id=model_id, models_path=MODELS_PATH, logger=current_app.logger)
        current_app.config['MODEL_SERVICE'].loadResources()
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
        
        model_service = current_app.config.get('MODEL_SERVICE')
        if not model_service:
            current_app.logger.error("Model service not found in app config.")
            return jsonify({"error": "Model service not configured"}), 500

        response = model_service.identify(temp_audio_path)
        
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