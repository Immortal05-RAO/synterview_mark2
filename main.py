import os
import uvicorn
from src.config import settings

if __name__ == "__main__":
    port = int(os.environ.get("PORT", settings.PORT))
    is_dev = settings.ENVIRONMENT.lower() == "development"

    print("=" * 60)
    print(" SYNTERVIEW AI BACKEND MVP")
    print(f" Listening on: http://0.0.0.0:{port}")
    print(f" Swagger UI:   http://localhost:{port}/docs")
    print(f" Health Check: http://localhost:{port}/api/health")
    print(f" Environment:  {settings.ENVIRONMENT}")
    print(f" AI Provider:  {settings.AI_PROVIDER}")
    print("=" * 60)

    uvicorn.run(
        "src.app:app",
        host="0.0.0.0",
        port=port,
        reload=is_dev
    )
