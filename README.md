# VoicePrint

VoicePrint is a speaker identification system built using TensorFlow and MFCC (Mel-frequency cepstral coefficients) features extracted from audio data. This project leverages deep learning to recognize individual speakers based on their voice patterns.

## Overview

- **Purpose**: Develop a model to identify speakers from audio samples, with potential for deployment on resource-constrained devices using TensorFlow Lite.
- **Features**: Extracts MFCCs, trains a CNN model, and evaluates performance with training/validation metrics.

## Getting Started

### Prerequisites

- Python 3.8 or later
- Required libraries:
  - `tensorflow`
  - `librosa`
  - `numpy`
  - `scipy`
  - `matplotlib`
  - `sklearn`
- Tools:
  - `ffmpeg` (for audio conversion)
  - `bash` (for script execution)

Install dependencies using pip:
```bash
pip install tensorflow librosa numpy scipy matplotlib scikit-learn
```

Install `ffmpeg`:
- On Ubuntu/Linux: `sudo apt install ffmpeg`
- On macOS: `brew install ffmpeg` (requires Homebrew)
- On Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html)


```sh
python3 -m voiceprint.http_server
```