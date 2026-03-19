FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY libs/ libs/
COPY services/pipeline_service/ services/pipeline_service/

EXPOSE 8004

CMD ["uvicorn", "services.pipeline_service.main:app", "--host", "0.0.0.0", "--port", "8004"]
