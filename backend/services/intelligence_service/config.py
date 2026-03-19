from libs.shared.config import BaseServiceSettings, DatabaseSettings, Neo4jSettings


class IntelligenceServiceSettings(BaseServiceSettings):
    service_name: str = "intelligence-service"
    port: int = 8003
    db: DatabaseSettings = DatabaseSettings(name="intelligence_db")
    neo4j: Neo4jSettings = Neo4jSettings()
    llm_provider: str = "anthropic"
    anthropic_api_key: str = ""
    model_config = {"env_prefix": ""}


settings = IntelligenceServiceSettings()
