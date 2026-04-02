"""
Step 4 — Damage Type Detection Service

Purpose
-------
Send accepted Step2 image to Hugging Face Space API (Step4)
and return structured damage detections.

Flow
----
1. Read image from disk
2. Send image to Step4 Space API
3. Parse JSON response
4. Return normalized result
"""

from __future__ import annotations

import os
from typing import Any

import requests
from dotenv import load_dotenv


load_dotenv()

STEP4_DAMAGE_TYPE_API_URL = os.getenv("STEP4_DAMAGE_TYPE_API_URL")


def predict_step4_damage_type(image_path: str, timeout: int = 120) -> dict[str, Any]:
    """
    Send accepted Step2 image to Hugging Face Step4 API.

    Expected response:
    {
        "status": "extracted" | "no_damage_detected",
        "message": "...",
        "errors": [],
        "outputs": {
            "annotated_image_base64": "..."
        },
        "damages": [...]
    }
    """

    if not STEP4_DAMAGE_TYPE_API_URL:
        raise ValueError("STEP4_DAMAGE_TYPE_API_URL is missing in .env")

    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Accepted image not found: {image_path}")

    with open(image_path, "rb") as f:
        files = {
            "image": ("image.png", f, "image/png")
        }

        response = requests.post(
            STEP4_DAMAGE_TYPE_API_URL,
            files=files,
            timeout=timeout,
        )

    if response.status_code != 200:
        try:
            detail = response.json()
        except Exception:
            detail = response.text

        raise RuntimeError(f"Step4 API failed: status={response.status_code}, detail={detail}")

    try:
        data = response.json()
    except Exception as exc:
        raise RuntimeError(f"Invalid JSON returned from Step4 API: {exc}")

    if "status" not in data or "damages" not in data:
        raise RuntimeError(f"Unexpected Step4 API response format: {data}")

    return data