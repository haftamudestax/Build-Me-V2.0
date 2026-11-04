
import os

ENVIRONMENT = os.getenv("APP_ENV", "development").lower()

if ENVIRONMENT == "production":
    ALLOWED_ORIGINS = [
        "https://haftamu-desta-dnbcqjyjl-haftamudestaxs-projects.vercel.app",
    ]
else:
    ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://127.0.0.1:5177",
    ]
