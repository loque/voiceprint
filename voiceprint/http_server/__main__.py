import os
import logging
from flask import Flask, send_from_directory
from flask_cors import CORS

# Suppress TensorFlow logging early
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # FATAL
logging.getLogger('tensorflow').setLevel(logging.FATAL)

def create_app():
    app = Flask(__name__)
    CORS(app)

    # Configure logging
    app.logger.setLevel(logging.INFO)
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
    app.logger.addHandler(stream_handler)

    @app.route('/samples/<path:path>')
    def send_sample(path):
        return send_from_directory('../voices', path)

    from .voices import voices
    app.register_blueprint(voices, url_prefix='/voices')
    
    from .models import models
    app.register_blueprint(models, url_prefix='/models')

    return app

if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)