FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY libs/ libs/
COPY services/export_service/ services/export_service/

EXPOSE 8007

CMD ["uvicorn", "services.export_service.main:app", "--host", "0.0.0.0", "--port", "8007"]
