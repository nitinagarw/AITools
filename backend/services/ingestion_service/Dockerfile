FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY libs/ libs/
COPY services/ingestion_service/ services/ingestion_service/

CMD ["celery", "-A", "services.ingestion_service.worker", "worker", "--loglevel=info"]
