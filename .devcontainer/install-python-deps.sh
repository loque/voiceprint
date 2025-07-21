#!/bin/bash
set -e

pip install --upgrade pip

# First install the voiceprint package in editable mode with CPU extras
pip install --extra-index-url https://download.pytorch.org/whl/cpu -e ./voiceprint[cpu]

# Install rest_api requirements
pip install --extra-index-url https://download.pytorch.org/whl/cpu -r ./rest_api/requirements.txt

# Install wyoming_voiceprint requirements
pip install --extra-index-url https://download.pytorch.org/whl/cpu -r ./wyoming_voiceprint/requirements.txt
