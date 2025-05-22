from flask import Blueprint, jsonify, request, current_app

speakers = Blueprint('speakers', __name__)

@speakers.route('', methods=['GET'])
def get_speakers():
  speakerService = current_app.config.get('SPEAKER_SERVICE')
  speakers = speakerService.get_speakers()
  return jsonify(speakers), 200

@speakers.route('', methods=['POST'])
def add_speaker():
  if not request.json or 'name' not in request.json:
    return jsonify({"error": "Missing speaker name"}), 400

  speaker_name = request.json['name']

  speakerService = current_app.config.get('SPEAKER_SERVICE')
  speakerService.add_speaker(speaker_name)

  return jsonify({"message": "Speaker added successfully"}), 201

@speakers.route('/<speaker_name>/samples', methods=['POST'])
def add_speaker_sample(speaker_name):
  if not request.files or 'file' not in request.files:
    return jsonify({"error": "No file part"}), 400

  file = request.files['file']
  if file.filename == '':
    return jsonify({"error": "No selected file"}), 400

  speakerService = current_app.config.get('SPEAKER_SERVICE')
  speakerService.add_speaker_sample(speaker_name, file)

  return jsonify({"message": "Speaker sample added successfully"}), 201

@speakers.route('/<speaker_name>/samples/<sample_name>', methods=['DELETE'])
def delete_speaker_sample(speaker_name, sample_name):
  speakerService = current_app.config.get('SPEAKER_SERVICE')
  speakerService.delete_speaker_sample(speaker_name, sample_name)
  return jsonify({"message": "Speaker sample deleted successfully"}), 200