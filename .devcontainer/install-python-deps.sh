#!/bin/bash
set -e

# Install voiceprint package in development mode
# pip install -r ./voiceprint/requirements_cpu.txt
# pip install -r ./voiceprint/requirements.txt

# Install REST API requirements
pip install -r ./rest_api/requirements.txt

# Install wyoming_voiceprint requirements
pip install -r ./wyoming_voiceprint/requirements.txt
