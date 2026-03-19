from libs.shared.config import BaseServiceSettings, Neo4jSettings


class KnowledgeEngineSettings(BaseServiceSettings):
    service_name: str = "knowledge-engine"
    port: int = 8008
    neo4j: Neo4jSettings = Neo4jSettings()
    embedding_endpoint: str = "http://localhost:8080"
    model_config = {"env_prefix": ""}


settings = KnowledgeEngineSettings()
