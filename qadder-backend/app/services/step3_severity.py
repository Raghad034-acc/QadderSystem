"""
Step 3 — Severity Prediction Service

Purpose
-------
Send accepted Step2 image to Hugging Face Space API
and return structured severity result.

Flow
----
1. Read image from disk
2. Send image to Step3 Space API
3. Parse JSON response
4. Return normalized result
"""

# ---------------------------------------------------
# Imports
# ---------------------------------------------------
from __future__ import annotations

import os
from typing import Any

import requests
from dotenv import load_dotenv

# ---------------------------------------------------
# Load Environment Variables
# ---------------------------------------------------
load_dotenv()

# ---------------------------------------------------
# Step 3 API Configuration
# ---------------------------------------------------
STEP3_SEVERITY_API_URL = os.getenv("SEVERITY_API_URL")

# ---------------------------------------------------
# Predict Damage Severity
# ---------------------------------------------------
def predict_step3_severity(image_path: str, timeout: int = 60) -> dict[str, Any]:
    """
    Send accepted Step2 image to Hugging Face Step3 API.

    Returns normalized JSON like:
    {
        "status": "predicted" | "rejected_high_severity",
        "message": "...",
        "errors": [],
        "prediction": {
            "raw_label": "...",
            "severity": {
                "en": "low|medium|high",
                "ar": "منخفض|متوسط|مرتفع"
            },
            "confidence": 0.97,
            "probabilities": {...}
        }
    }
    """
    
    # Check if API URL is configured
    if not STEP3_SEVERITY_API_URL:
        raise ValueError("STEP3_SEVERITY_API_URL is missing in .env")

    # Check if image file exists
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Accepted image not found: {image_path}")

    # Open image and prepare request file
    with open(image_path, "rb") as f:
        files = {
            "image": ("image.png", f, "image/png")
        }

    # Send image to Step3 severity API
        response = requests.post(
            STEP3_SEVERITY_API_URL,
            files=files,
            timeout=timeout,
        )
 
    # Handle API error response
    if response.status_code != 200:
        try:
            detail = response.json()
        except Exception:
            detail = response.text

        raise RuntimeError(f"Step3 API failed: status={response.status_code}, detail={detail}")

    # Parse API JSON response
    try:
        data = response.json()
    except Exception as exc:
        raise RuntimeError(f"Invalid JSON returned from Step3 API: {exc}")

   # Validate response structure
    if "status" not in data or "prediction" not in data:
        raise RuntimeError(f"Unexpected Step3 API response format: {data}")

    return data