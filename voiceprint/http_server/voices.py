import os
from typing import Dict, List
from flask import Blueprint, jsonify, request

voices = Blueprint('voices', __name__)

# TODO: share with ModelService
class Voices(Dict[str, List[str]]):
    pass

VOICES_PATH = os.getenv('VOICES_PATH')

@voices.route('', methods=['GET'])
def get_voices():
    voices: Voices = {}
    if not os.path.exists(VOICES_PATH):
        return jsonify(voices), 200
    for entry in os.listdir(VOICES_PATH):
        entry_path = os.path.join(VOICES_PATH, entry)
        if os.path.isdir(entry_path):
            wav_files = sorted([f for f in os.listdir(entry_path)
                                if os.path.isfile(os.path.join(entry_path, f)) and f.lower().endswith('.wav')])
            voices[entry] = wav_files
    return jsonify(voices), 200

@voices.route('', methods=['POST'])
def add_voice():
    if not request.json or 'name' not in request.json:
        return jsonify({"error": "Missing voice name"}), 400

    voice_name = request.json['name']

    # Create a new directory for the voice if it doesn't exist
    voice_dir = os.path.join(VOICES_PATH, voice_name)
    os.makedirs(voice_dir, exist_ok=True)

    return jsonify({"message": "Voice added successfully"}), 201

@voices.route('/<voice_name>/samples', methods=['POST'])
def add_voice_sample(voice_name):
    if not request.files or 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    voice_dir = os.path.join(VOICES_PATH, voice_name)

    # Save the uploaded file
    file_path = os.path.join(voice_dir, file.filename)
    file.save(file_path)

    return jsonify({"message": "Voice file added successfully"}), 201

@voices.route('/<voice_name>/samples/<sample_name>', methods=['DELETE'])
def delete_voice_sample(voice_name, sample_name):
    voice_dir = os.path.join(VOICES_PATH, voice_name)
    file_path = os.path.join(voice_dir, sample_name)

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    os.remove(file_path)
    return jsonify({"message": "Voice file deleted successfully"}), 200