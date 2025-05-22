# Voiceprint

> ⚠️🚧 **EXPERIMENTAL & WORK IN PROGRESS** 🚧⚠️
>
> This project is under active development and is not production-ready. Use at your own risk!

## Introduction

**Voiceprint** is a speaker identification system that uses deep learning and audio feature extraction to recognize who is speaking from short audio samples. The system is designed to be efficient and portable, with the goal of running on resource-constrained devices.

**Final Goal:** Integrate Voiceprint as part of the [Home Assistant](https://www.home-assistant.io/) assist pipeline for local, privacy-friendly speaker identification.

## Repository Structure

- **voiceprint/**: Written in Python, this is the backend responsible for generating speaker detection models and using them to identify speakers from audio samples.
- **frontend/**: Written in TypeScript with React/Next.js, this provides a graphical user interface (GUI) for interacting with the backend.

## How to Run

You can run Voiceprint using Docker and Docker Compose. This is the recommended way to get started quickly without worrying about dependencies.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Quick Start

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/voiceprint.git
   cd voiceprint
   ```
2. Start the service:
   ```bash
   docker compose up --build
   ```
3. The service will be available at the address shown in the terminal output.

---

This project is in early development. Contributions and feedback are welcome!

---

Follow me on X: [@loque_js](https://x.com/loque_js)
