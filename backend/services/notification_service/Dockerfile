FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY libs/ libs/
COPY services/notification_service/ services/notification_service/

EXPOSE 8005

CMD ["uvicorn", "services.notification_service.main:app", "--host", "0.0.0.0", "--port", "8005"]
