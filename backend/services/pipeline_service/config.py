from libs.shared.config import BaseServiceSettings, DatabaseSettings


class PipelineServiceSettings(BaseServiceSettings):
    service_name: str = "pipeline-service"
    port: int = 8004
    db: DatabaseSettings = DatabaseSettings(name="pipeline_db")
    credit_service_url: str = "http://localhost:8006"
    org_service_url: str = "http://localhost:8002"
    model_config = {"env_prefix": ""}


settings = PipelineServiceSettings()
