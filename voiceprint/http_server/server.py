import os
from flask import Blueprint, request, jsonify, current_app
import uuid
import json
from voiceprint.model import Model

main = Blueprint('main', __name__)

@main.route('/models', methods=['GET'])
def get_models():
    models_dir = os.path.join(current_app.instance_path, 'models')
    models = []
    if not os.path.exists(models_dir):
        return jsonify(models), 200
    for entry in os.listdir(models_dir):
        entry_path = os.path.join(models_dir, entry)
        if os.path.isdir(entry_path):
            model_json_path = os.path.join(entry_path, 'metadata.json')
            if os.path.isfile(model_json_path):
                try:
                    with open(model_json_path, 'r') as f:
                        model_data = json.load(f)
                        models.append(model_data)
                except Exception as e:
                    current_app.logger.error(f"Error reading {model_json_path}: {e}")
    return jsonify(models), 200

@main.route('/models', methods=['POST'])
def create_model():
    data = request.get_json()
    if not data or 'voices' not in data or 'name' not in data:
        return jsonify({'error': 'Missing voices or name in request body'}), 400

    model_voices = data['voices']
    model_name = data['name']
    
    # Instantiate the Model class
    logger = current_app.logger
    cwd = current_app.instance_path
    model = Model(name=model_name, voices=model_voices, logger=logger, cwd=cwd)
    
    try:
        # Extract MFCCs, train the model, and save metadata
        model.extract_mfccs()
        model.train()
        model.saveMetadata()

        return jsonify({'message': 'Model created successfully', 'id': model.id}), 200
    except Exception as e:
        logger.error(f"Error during model creation: {e}", exc_info=True)
        return jsonify({'error': 'Failed to create model'}), 500

@main.route('/voices', methods=['GET'])
def get_voices():
    voices_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../voices'))
    voices = {}
    if not os.path.exists(voices_dir):
        return jsonify({}), 200
    for entry in os.listdir(voices_dir):
        entry_path = os.path.join(voices_dir, entry)
        if os.path.isdir(entry_path):
            wav_files = sorted([f for f in os.listdir(entry_path)
                                if os.path.isfile(os.path.join(entry_path, f)) and f.lower().endswith('.wav')])
            voices[entry] = wav_files
    return jsonify(voices), 200

@main.route('/identify', methods=['POST'])
def identify():
    if 'audio_file' not in request.files:
        return jsonify({"error": "No audio file part"}), 400
    
    file = request.files['audio_file']
    
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
        
        interpreter = current_app.config.get('VOICEPRINT_INTERPRETER')
        if not interpreter:
            current_app.logger.error("Interpreter not found in app config.")
            return jsonify({"error": "Interpreter not configured"}), 500

        response = interpreter.identify(temp_audio_path)
        
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
