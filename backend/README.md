# MAQAM Align Backend

FastAPI server for Arabic Forced Alignment using Montreal Forced Aligner (MFA).

## Pre-requisites

You must download the three required Arabic MFA models before running:

```bash
mfa model download acoustic arabic_mfa
mfa model download dictionary arabic_mfa
mfa model download g2p arabic_mfa
```

## Setup & Running

1. Install requirements:
```bash
pip install -r requirements.txt
```

2. Run the application:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
