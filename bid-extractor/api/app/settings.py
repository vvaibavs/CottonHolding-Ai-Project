from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    gemini_api_key: str
    allowed_origins: str = "http://localhost:5173"
    max_upload_mb: int = 50
    debug: bool = False

    @property
    def origins_list(self) -> list[str]:
        return [s.strip() for s in self.allowed_origins.split(",")]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
