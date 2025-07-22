# Voiceprint

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

**Voiceprint** is a speaker identification system based on [SpeechBrain](https://github.com/speechbrain/speechbrain), a PyTorch-based toolkit for speech processing. This project aims to create a lightweight, efficient, and portable solution for identifying speakers from short audio samples.

<p align="center">⚠️🚧 EXPERIMENTAL & WORK IN PROGRESS 🚧⚠️</p>

## Voiceprint Core Library

The core library provides functionality to:

- Create and manage voice libraries
- Add and remove speakers and samples
- Identify speakers from audio inputs

## Dashboard

The Dashboard is a web-based GUI for interacting with Voiceprint:

- Create or import voice libraries
- Record and enroll speaker samples
- Perform speaker identification
- Export libraries for external use

### Running the Dashboard

Requires Docker and Docker Compose:

1. Clone the repository:

   ```bash
   git clone https://github.com/loque/voiceprint.git
   cd voiceprint
   ```

2. Build and start services:

   ```bash
   docker-compose up --build
   ```

3. Open your browser at [http://localhost:5173](http://localhost:5173) to access the Dashboard.

## Wyoming Voiceprint

Wyoming Voiceprint is a Voiceprint wrapper to integrate with the Wyoming protocol.

## License & Citations

This project uses:

- [SpeechBrain](https://github.com/speechbrain/speechbrain), licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- The [ECAPA-TDNN speaker recognition model](https://huggingface.co/speechbrain/spkrec-ecapa-voxceleb) provided by the SpeechBrain team.

If you use this project in your research or product, please cite SpeechBrain:

```bibtex
@misc{speechbrain,
  title={{SpeechBrain}: A General-Purpose Speech Toolkit},
  author={Mirco Ravanelli and Titouan Parcollet and Peter Plantinga and Aku Rouhe and Samuele Cornell and Loren Lugosch and Cem Subakan and Nauman Dawalatabad and Abdelwahab Heba and Jianyuan Zhong and Ju-Chieh Chou and Sung-Lin Yeh and Szu-Wei Fu and Chien-Feng Liao and Elena Rastorgueva and François Grondin and William Aris and Hwidong Na and Yan Gao and Renato De Mori and Yoshua Bengio},
  year={2021},
  eprint={2106.04624},
  archivePrefix={arXiv},
  primaryClass={eess.AS},
  note={arXiv:2106.04624}
}
```

## Contributing

Voiceprint is in early experimental development. I'd love your help exploring the possibilities of speaker identification!

I'm excited to hear from you! Open an [issue](https://github.com/loque/voiceprint/issues/new) to discuss ideas, report bugs, or ask questions about the Wyoming protocol integration.

### Get in Touch

Find me on:

- X (formerly Twitter): [@loque_js](https://x.com/loque_js)
- Reddit: [the_loque](https://www.reddit.com/user/the_loque/)
