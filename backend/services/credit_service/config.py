from libs.shared.config import BaseServiceSettings, DatabaseSettings


class CreditServiceSettings(BaseServiceSettings):
    service_name: str = "credit-service"
    port: int = 8006
    db: DatabaseSettings = DatabaseSettings(name="credit_db")
    model_config = {"env_prefix": ""}


settings = CreditServiceSettings()
