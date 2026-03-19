from libs.shared.config import BaseServiceSettings, DatabaseSettings


class OrgServiceSettings(BaseServiceSettings):
    service_name: str = "org-service"
    port: int = 8002
    db: DatabaseSettings = DatabaseSettings(name="org_db")
    intelligence_service_url: str = "http://localhost:8003"

    model_config = {"env_prefix": ""}


settings = OrgServiceSettings()
