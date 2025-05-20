import os
import logging
from flask import Flask

from ..interpreter import InterpreterConfig, Interpreter

# Suppress TensorFlow logging early
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # FATAL
logging.getLogger('tensorflow').setLevel(logging.FATAL)

def create_app():
    app = Flask(__name__)

    # Configure logging
    app.logger.setLevel(logging.INFO)
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
    app.logger.addHandler(stream_handler)

    try:
        interpreter = Interpreter(InterpreterConfig(), app.logger)
        app.config['VOICEPRINT_INTERPRETER'] = interpreter
        app.logger.info("Interpreter initialized and configured in Flask app.")
    except RuntimeError as e:
        app.logger.error(f"CRITICAL: Failed to initialize Interpreter during app initialization: {e}. The /identify endpoint will not work.")
        raise RuntimeError("Failed to initialize Interpreter")

    from .server import main as main_blueprint
    app.register_blueprint(main_blueprint)

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)