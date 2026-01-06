FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY iot_anomaly_detection ./iot_anomaly_detection
COPY config ./config
COPY iot-anomaly-ui/backend ./iot-anomaly-ui/backend

ENV PYTHONPATH=/app

WORKDIR /app/iot-anomaly-ui/backend

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
