import argparse
import asyncio
from functools import partial
import os

from wyoming.server import AsyncServer

from wyoming_voiceprint.handler import WyomingEventHandler
from voiceprint.voiceprint import Voiceprint
from utils import get_logger

_LOGGER = get_logger("main")

def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("--uri", help="unix:// or tcp://", default="tcp://0.0.0.0:9002")
    parser.add_argument("--library-path", help="Path to library to load", default=None)
    return parser.parse_args()

async def main() -> None:
    args = parse_arguments()
    if not args.library_path:
        raise ValueError("Library path must be specified with --library-path")
    
    library_dir = os.path.dirname(args.library_path)
    library_id = os.path.splitext(os.path.basename(args.library_path))[0]
    _LOGGER.info("Loading library %s in folder %s", library_id, library_dir)

    # Initialize Voiceprint
    voiceprint = Voiceprint(libs_path=library_dir)

    _LOGGER.info("Starting Wyoming Voiceprint on %s", args.uri)
    server = AsyncServer.from_uri(args.uri)

    try:
        await server.run(partial(WyomingEventHandler, voiceprint=voiceprint))
    except KeyboardInterrupt:
        pass
    finally:
        await server.stop()

if __name__ == "__main__":
    asyncio.run(main())