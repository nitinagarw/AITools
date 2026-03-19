from libs.shared.config import BaseServiceSettings, DatabaseSettings


class UserServiceSettings(BaseServiceSettings):
    service_name: str = "user-service"
    port: int = 8001
    db: DatabaseSettings = DatabaseSettings(name="user_db")

    model_config = {"env_prefix": ""}


settings = UserServiceSettings()
