import argparse
import asyncio
from functools import partial

from wyoming.server import AsyncServer

from wyoming_voiceprint.handler import WyomingEventHandler
from voiceprint.voiceprint import Voiceprint, model
from utils import get_logger

_LOGGER = get_logger("main")

def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("--uri", help="unix:// or tcp://", default="tcp://0.0.0.0:9002")
    parser.add_argument("--speakers-db", help="Path to speakers database file", default=None)
    return parser.parse_args()

async def main() -> None:
    args = parse_arguments()
    _LOGGER.info("Starting Wyoming Voiceprint on %s", args.uri)
    _LOGGER.info("Using speakers database: %s", args.speakers_db or "default location")

    # Initialize Voiceprint instance
    _LOGGER.info("Initializing Voiceprint model...")
    voiceprint = Voiceprint(model=model, db_path=args.speakers_db)
    speakers = voiceprint.get_enrolled_speakers()
    _LOGGER.info("Voiceprint initialized with %d enrolled speakers: %s", len(speakers), speakers)

    server = AsyncServer.from_uri(args.uri)

    try:
        await server.run(partial(WyomingEventHandler, voiceprint=voiceprint))
    except KeyboardInterrupt:
        pass
    finally:
        await server.stop()

if __name__ == "__main__":
    asyncio.run(main())