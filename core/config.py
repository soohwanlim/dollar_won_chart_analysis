from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RealK API"
    VERSION: str = "1.0.0"
    
    # API Keys (Loaded from environment variables)
    FRED_API_KEY: str | None = None
    KOSIS_API_KEY: str | None = None
    
    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()
