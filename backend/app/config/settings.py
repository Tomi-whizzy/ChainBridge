from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings


# The default JWT secret shipped with the repo. Used during local development
# but explicitly rejected on startup when `debug` is False (#430).
DEFAULT_JWT_SECRET = "change-me-in-production"


class Settings(BaseSettings):
    app_name: str = "ChainBridge"
    debug: bool = False

    # Database
    database_url: str = (
        "postgresql+asyncpg://chainbridge:password@localhost:5432/chainbridge"
    )

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    jwt_secret_key: str = DEFAULT_JWT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60

    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60

    # Price Oracle
    price_oracle_timeout_secs: float = 10.0

    # Email
    email_enabled: bool = False
    email_provider: str = "sendgrid"  # sendgrid or ses
    sendgrid_api_key: str = ""
    ses_access_key: str = ""
    ses_secret_key: str = ""
    ses_region: str = "us-east-1"
    email_from: str = "noreply@chainbridge.io"
    email_from_name: str = "ChainBridge"

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production", "false", "0", "off"}:
                return False
            if normalized in {"debug", "dev", "development", "true", "1", "on"}:
                return True
        return value

    @model_validator(mode="after")
    def reject_default_jwt_secret_in_production(self) -> "Settings":
        """#430 — non-debug mode must not start with the bundled default
        secret. The error names the offending setting and the env var the
        operator should change so the cause is obvious from the logs."""
        if not self.debug and self.jwt_secret_key == DEFAULT_JWT_SECRET:
            raise ValueError(
                "Refusing to start in production with the default JWT secret. "
                "Set the `JWT_SECRET_KEY` environment variable to a unique value "
                "(e.g. a 32-byte random hex string) before deploying."
            )
        return self

    class Config:
        env_file = ".env"


settings = Settings()
