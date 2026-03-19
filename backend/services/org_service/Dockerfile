FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY libs/ libs/
COPY services/org_service/ services/org_service/

EXPOSE 8002

CMD ["uvicorn", "services.org_service.main:app", "--host", "0.0.0.0", "--port", "8002"]
