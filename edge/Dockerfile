FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY edge_agent.py ./

# -u keeps stdout unbuffered so telemetry and USSD alerts appear in docker logs live.
CMD ["python", "-u", "edge_agent.py"]
