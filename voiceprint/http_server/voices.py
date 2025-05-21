import os
from flask import Blueprint, jsonify
from typing import List, Dict

voices = Blueprint('voices', __name__)

# TODO: share with ModelService
class Voices(Dict[str, List[str]]):
    pass

@voices.route('', methods=['GET'])
def get_voices():
    voices_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../voices'))
    voices: Voices = {}
    if not os.path.exists(voices_dir):
        return jsonify(voices), 200
    for entry in os.listdir(voices_dir):
        entry_path = os.path.join(voices_dir, entry)
        if os.path.isdir(entry_path):
            wav_files = sorted([f for f in os.listdir(entry_path)
                                if os.path.isfile(os.path.join(entry_path, f)) and f.lower().endswith('.wav')])
            voices[entry] = wav_files
    return jsonify(voices), 200




