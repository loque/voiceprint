import logging

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logging.basicConfig(
        level=logging.INFO,
        format="%(levelname)-8s %(name)-11s %(message)s"
    )
    return logger