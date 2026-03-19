from libs.shared.config import BaseServiceSettings, DatabaseSettings


class ExportServiceSettings(BaseServiceSettings):
    service_name: str = "export-service"
    port: int = 8007
    db: DatabaseSettings = DatabaseSettings(name="export_db")
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "ai360minio"
    s3_secret_key: str = "ai360minio_secret"
    s3_bucket: str = "ai360-exports"
    model_config = {"env_prefix": ""}


settings = ExportServiceSettings()
