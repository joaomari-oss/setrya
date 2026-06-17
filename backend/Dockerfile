FROM python:3.12-slim

WORKDIR /app

# System deps for librosa/scipy
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 ffmpeg libgomp1 && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# --trusted-host: some networks (e.g. Avast TLS inspection) inject a corporate
# root CA the slim image doesn't trust, breaking pip's cert verification.
RUN pip install --no-cache-dir \
    --trusted-host pypi.org \
    --trusted-host files.pythonhosted.org \
    --trusted-host pypi.python.org \
    -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
