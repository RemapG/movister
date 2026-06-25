FROM python:3.12-alpine

WORKDIR /app

# Install dependencies needed for httpx (like certifi, etc.)
RUN apk add --no-cache curl

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .
COPY templates/ templates/

EXPOSE 5055

CMD ["python", "main.py"]
