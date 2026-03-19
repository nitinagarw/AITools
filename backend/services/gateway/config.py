from libs.shared.config import BaseServiceSettings, JWTSettings


class GatewaySettings(BaseServiceSettings):
    service_name: str = "api-gateway"
    port: int = 8000

    sso_issuer_url: str = "https://sso.example.com"
    sso_client_id: str = ""
    sso_client_secret: str = ""

    jwt: JWTSettings = JWTSettings()

    user_service_url: str = "http://localhost:8001"
    org_service_url: str = "http://localhost:8002"
    intelligence_service_url: str = "http://localhost:8003"
    pipeline_service_url: str = "http://localhost:8004"
    notification_service_url: str = "http://localhost:8005"
    credit_service_url: str = "http://localhost:8006"
    export_service_url: str = "http://localhost:8007"

    rate_limit_per_minute: int = 120

    model_config = {"env_prefix": ""}


settings = GatewaySettings()
