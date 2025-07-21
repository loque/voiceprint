# filepath: /workspaces/voiceprint/rest_api/__main__.py
import uvicorn
from .api import api

if __name__ == "__main__":
    uvicorn.run(api, host="0.0.0.0", port=9797)