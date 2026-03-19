from libs.shared.config import BaseServiceSettings, DatabaseSettings


class IngestionServiceSettings(BaseServiceSettings):
    service_name: str = "ingestion-service"
    db: DatabaseSettings = DatabaseSettings(name="org_db")
    model_config = {"env_prefix": ""}


settings = IngestionServiceSettings()
