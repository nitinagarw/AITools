FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY libs/ libs/
COPY services/knowledge_engine/ services/knowledge_engine/

CMD ["uvicorn", "services.knowledge_engine.main:app", "--host", "0.0.0.0", "--port", "8008"]
