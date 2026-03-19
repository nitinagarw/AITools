from libs.shared.config import BaseServiceSettings, DatabaseSettings


class NotificationServiceSettings(BaseServiceSettings):
    service_name: str = "notification-service"
    port: int = 8005
    db: DatabaseSettings = DatabaseSettings(name="notification_db")
    user_service_url: str = "http://localhost:8001"
    sendgrid_api_key: str | None = None
    twilio_account_sid: str | None = None
    twilio_auth_token: str | None = None
    twilio_from_number: str | None = None
    model_config = {"env_prefix": ""}


settings = NotificationServiceSettings()
