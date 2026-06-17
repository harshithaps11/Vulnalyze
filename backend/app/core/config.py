from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import Optional
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "Vulnalyze"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "supersecretkeydevelopmentpurposesonly12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    POSTGRES_SERVER: Optional[str] = None
    POSTGRES_USER: Optional[str] = None
    POSTGRES_PASSWORD: Optional[str] = None
    POSTGRES_DB: Optional[str] = None
    SQLALCHEMY_DATABASE_URI: Optional[str] = None
    
    # Redis
    REDIS_HOST: Optional[str] = None
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    
    # RabbitMQ
    RABBITMQ_HOST: Optional[str] = None
    RABBITMQ_PORT: int = 5672
    RABBITMQ_USER: Optional[str] = "guest"
    RABBITMQ_PASSWORD: Optional[str] = "guest"
    
    # Scanning
    SEMGREP_RULES_PATH: str = "rules"
    ZAP_API_KEY: Optional[str] = None
    ZAP_HOST: str = "localhost"
    ZAP_PORT: int = 8080
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )
    
    class Config:
        case_sensitive = True
        env_file = ".env"

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.SQLALCHEMY_DATABASE_URI:
            if self.POSTGRES_SERVER:
                self.SQLALCHEMY_DATABASE_URI = (
                    f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                    f"@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"
                )
            else:
                self.SQLALCHEMY_DATABASE_URI = "sqlite+aiosqlite:///backend/data/vulnalyze.db"

@lru_cache()
def get_settings() -> Settings:
    return Settings() 