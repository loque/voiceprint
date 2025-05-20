import os
from flask import Blueprint, request, jsonify, current_app

main = Blueprint('main', __name__)

@main.route('/identify', methods=['POST'])
def identify_endpoint():
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
        current_app.logger.error(f"Error in identify_endpoint: {e}", exc_info=True)
        return jsonify({"error": "An internal server error occurred"}), 500
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
                current_app.logger.info(f"Temporary audio file {temp_audio_path} removed.")
            except Exception as e:
                current_app.logger.error(f"Error removing temporary file {temp_audio_path}: {e}")
