from __future__ import annotations

import os
from typing import Any

import requests
from dotenv import load_dotenv


# Load environment variables
load_dotenv()

# Step6 API endpoint (severity model)
STEP6_DAMAGE_SEVERITY_API_URL = os.getenv("SEVERITY_API_URL")

# Step6 Prediction Function
def predict_step6_damage_severity(crop_path: str, timeout: int = 60) -> dict[str, Any]:
    """
    Step 6 Service

    Purpose:
    Send damage crop image to Step6 model API
    and return severity prediction.

    Expected response format:
    {
        "status": "...",
        "prediction": {
            "raw_label": "...",
            "severity": {
                "en": "...",
                "ar": "..."
            },
            "confidence": 0.95,
            "policy": {
                "status": "allowed" or "rejected"
            },
            "probabilities": {...}
        }
    }
    """

    # Validate API URL exists
    if not STEP6_DAMAGE_SEVERITY_API_URL:
        raise ValueError("STEP6_DAMAGE_SEVERITY_API_URL is missing in .env")

    # Validate crop image path
    if not os.path.exists(crop_path):
        raise FileNotFoundError(f"Damage crop not found: {crop_path}")

    # Send image to Step6 API
    with open(crop_path, "rb") as f:
        files = {
            "image": ("crop.png", f, "image/png")
        }

        response = requests.post(
            STEP6_DAMAGE_SEVERITY_API_URL,
            files=files,
            timeout=timeout,
        )

    # Handle non-success HTTP response
    if response.status_code != 200:
        try:
            detail = response.json()
        except Exception:
            detail = response.text

        raise RuntimeError(
            f"Step6 API failed: status={response.status_code}, detail={detail}"
        )

    # Parse JSON response
    try:
        data = response.json()
    except Exception as exc:
        raise RuntimeError(f"Invalid JSON returned from Step6 API: {exc}")

    # Validate required keys in response
    if "status" not in data or "prediction" not in data:
        raise RuntimeError(f"Unexpected Step6 API response format: {data}")

    # Extract prediction object
    prediction = data.get("prediction", {})
    if not isinstance(prediction, dict):
        raise RuntimeError(f"Invalid prediction object in Step6 response: {data}")

    # Validate severity object
    severity = prediction.get("severity", {})
    if not isinstance(severity, dict):
        raise RuntimeError(f"Invalid severity object in Step6 response: {data}")

    # Ensure severity contains required fields
    if "en" not in severity or "ar" not in severity:
        raise RuntimeError(f"Incomplete severity fields in Step6 response: {data}")

    # Ensure confidence value exists
    if "confidence" not in prediction:
        raise RuntimeError(f"Missing confidence in Step6 response: {data}")

    # Normalize optional fields 

    # Raw label from model (optional)
    prediction.setdefault("raw_label", None)

    # Probabilities dictionary (optional)
    prediction.setdefault("probabilities", None)

    # Policy object normalization
    policy = prediction.get("policy")
    if not isinstance(policy, dict):
        prediction["policy"] = {"status": None}
    else:
        policy.setdefault("status", None)

    # Return normalized Step6 response
    return data