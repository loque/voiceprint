import argparse
import asyncio
from functools import partial

from wyoming.server import AsyncServer

from wyoming_voiceprint.handler import WyomingEventHandler
from utils import get_logger

_LOGGER = get_logger("main")

def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("--uri", help="unix:// or tcp://", default="tcp://0.0.0.0:9002")
    return parser.parse_args()

async def main() -> None:
    args = parse_arguments()
    _LOGGER.info("Starting Wyoming Voiceprint on %s", args.uri)

    server = AsyncServer.from_uri(args.uri)

    try:
        await server.run(partial(WyomingEventHandler))
    except KeyboardInterrupt:
        pass
    finally:
        await server.stop()

if __name__ == "__main__":
    asyncio.run(main())