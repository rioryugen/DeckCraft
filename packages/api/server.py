# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
"""
DeckCraft API Server
Starts the FastAPI application with uvicorn.
"""
import uvicorn
import argparse
import os
from app.main import app

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="DeckCraft API server")
    parser.add_argument(
        "--port", type=int, required=True, help="Port number to run the server on"
    )
    parser.add_argument(
        "--reload", type=str, default="false", help="Reload the server on code changes"
    )
    args = parser.parse_args()
    reload = args.reload == "true"
    host = "127.0.0.1"

    os.environ["NEXT_PUBLIC_FAST_API"] = f"http://{host}:{args.port}"

    uvicorn.run(
        "app.main:app",
        host=host,
        port=args.port,
        log_level="info",
        reload=reload,
    )