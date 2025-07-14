import argparse
import asyncio
from functools import partial

from wyoming.server import AsyncServer

from wyoming_voiceprint.handler import WyomingEventHandler
from voiceprint.voiceprint import Voiceprint
from utils import get_logger

_LOGGER = get_logger("main")

def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("--uri", help="unix:// or tcp://", default="tcp://0.0.0.0:9002")
    parser.add_argument("--libraries-path", help="Path to libraries directory", default=None)
    parser.add_argument("--library-id", help="Library ID to load", default="default_library")
    return parser.parse_args()

async def main() -> None:
    args = parse_arguments()
    _LOGGER.info("Starting Wyoming Voiceprint on %s", args.uri)
    _LOGGER.info("Using libraries path: %s", args.libraries_path or "default location")
    _LOGGER.info("Using library ID: %s", args.library_id)

    # Initialize Voiceprint instance
    _LOGGER.info("Initializing Voiceprint model...")
    voiceprint = Voiceprint(libs_path=args.libraries_path)
    
    # Load or create speakers library
    try:
        voiceprint.load_library(args.library_id)
    except FileNotFoundError:
        _LOGGER.warning("Library not found, creating new library")
        voiceprint.create_library("Wyoming Voice Library")
    
    library = voiceprint.get_loaded_library()
    if library:
        speakers = list(library["speakers"].values())
        speaker_names = [speaker["name"] for speaker in speakers]
        _LOGGER.info("Voiceprint initialized with %d enrolled speakers: %s", len(speakers), speaker_names)
    else:
        _LOGGER.info("Voiceprint initialized with no library loaded")

    server = AsyncServer.from_uri(args.uri)

    try:
        await server.run(partial(WyomingEventHandler, voiceprint=voiceprint))
    except KeyboardInterrupt:
        pass
    finally:
        await server.stop()

if __name__ == "__main__":
    asyncio.run(main())