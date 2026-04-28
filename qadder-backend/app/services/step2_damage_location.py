"""
Step 2 — Damage Location Verification Service

Purpose
-------
Verify that the uploaded vehicle image matches the damage side
reported in Najm report.

Flow
----
1. Normalize Najm side
2. Run orientation API first
3. If API fails or mismatches, run Hugging Face parts fallback
4. Infer side from visible parts
5. Return accepted/rejected result

Notes
-----
- No local ML models are used
- Only Roboflow API + Hugging Face fallback
"""

# ---------------------------------------------------
# Imports
# ---------------------------------------------------

# Standard library
import os
from typing import Any

# Third-party
import numpy as np
from dotenv import load_dotenv
from gradio_client import Client
from inference_sdk import InferenceHTTPClient
from PIL import Image


# ---------------------------------------------------
# Load environment variables
# ---------------------------------------------------
load_dotenv()

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")
ROBOFLOW_MODEL_ID = os.getenv("ROBOFLOW_MODEL_ID")
ROBOFLOW_SERVERLESS_URL = os.getenv("ROBOFLOW_SERVERLESS_URL")

# Hugging Face fallback Space
PARTS_SPACE = os.getenv("PART_SEGMENTATION_MODEL_API_URL", "QadderAI/car-parts-segmentation")



# ---------------------------------------------------
# Roboflow orientation API client
# ---------------------------------------------------
RF_CLIENT = InferenceHTTPClient(
    api_url=ROBOFLOW_SERVERLESS_URL,
    api_key=ROBOFLOW_API_KEY,
)


# ---------------------------------------------------
# Normalize helpers
# ---------------------------------------------------
def normalize_side(value: str) -> str:
    """Normalize side labels into unified format."""
    if not value:
        return "unknown"

    value = str(value).strip().lower()

    mapping = {
        "front": "front",
        "rear": "rear",
        "back": "rear",
        "left": "left",
        "left side": "left",
        "right": "right",
        "right side": "right",
    }

    return mapping.get(value, value)

# ---------------------------------------------------
# Compare Najm and predicted damage sides
# ---------------------------------------------------
def is_side_match(najm_side: str, predicted_side: str) -> bool:
    """Compare Najm side with predicted side."""
    najm_side = normalize_side(najm_side)
    predicted_side = normalize_side(predicted_side)

    if najm_side == "unknown" or predicted_side == "unknown":
        return False

    return najm_side == predicted_side


# ---------------------------------------------------
# Orientation API
# ---------------------------------------------------
def run_orientation_api(image_path: str, conf_min: float = 0.50) -> dict[str, Any]:
    """Run Roboflow orientation model."""

    if not ROBOFLOW_API_KEY:
        return {
            "orientation": "unknown",
            "confidence": 0.0,
            "predictions_count": 0,
            "error": "missing_api_key",
            "raw": None,
        }

    try:
        # Send image to Roboflow model for inference
        result = RF_CLIENT.infer(image_path, model_id=ROBOFLOW_MODEL_ID)

         # Extract predictions from response
        preds = result.get("predictions", []) if isinstance(result, dict) else []

        # Handle case with no predictions
        if not preds:
            return {
                "orientation": "unknown",
                "confidence": 0.0,
                "predictions_count": 0,
                "error": None,
                "raw": result,
            }
        
         # Select prediction with highest confidence
        best = max(preds, key=lambda p: float(p.get("confidence", 0) or 0))

        orientation = normalize_side(best.get("class", "unknown"))
        confidence = float(best.get("confidence", 0) or 0)

        if confidence < conf_min:
            orientation = "unknown"

        return {
            "orientation": orientation,
            "confidence": confidence,
            "predictions_count": len(preds),
            "error": None,
            "raw": result,
        }

    except Exception as exc:
        return {
            "orientation": "unknown",
            "confidence": 0.0,
            "predictions_count": 0,
            "error": f"{type(exc).__name__}: {exc}",
            "raw": None,
        }


# ---------------------------------------------------
# Hugging Face segmentation
# ---------------------------------------------------
def run_parts_segmentation_hf(image_path: str):
    """
    Run Hugging Face parts segmentation fallback
    Returns:
    detected_image, segmentation_image
    """

    try:
        client = Client(PARTS_SPACE)

        result = client.predict(
            image_path,
            api_name="/predict"
        )

        if isinstance(result, (list, tuple)) and len(result) >= 2:
            return result[0], result[1]

        return None, None

    except Exception:
        return None, None


# ---------------------------------------------------
# HF label mapping
# ---------------------------------------------------
C = [
    "_background_",
    "back_bumper",
    "back_glass",
    "back_left_door",
    "back_left_light",
    "back_right_door",
    "back_right_light",
    "front_bumper",
    "front_glass",
    "front_left_door",
    "front_left_light",
    "front_right_door",
    "front_right_light",
    "hood",
    "left_mirror",
    "right_mirror",
    "tailgate",
    "trunk",
    "wheel",
]

# ---------------------------------------------------
# Color Palette for Visualization
# ---------------------------------------------------
COLORS = [
    (245, 255, 250),
    (75, 0, 130),
    (0, 255, 0),
    (32, 178, 170),
    (0, 0, 255),
    (0, 255, 255),
    (255, 0, 255),
    (128, 0, 128),
    (255, 140, 0),
    (85, 107, 47),
    (102, 205, 170),
    (0, 191, 255),
    (255, 0, 0),
    (255, 228, 196),
    (205, 133, 63),
    (220, 20, 60),
    (255, 69, 0),
    (143, 188, 143),
    (255, 255, 0),
]

COLOR_TO_CLASS = {COLORS[i]: C[i] for i in range(len(C))}


# ---------------------------------------------------
# Extract parts
# ---------------------------------------------------
def extract_parts_from_segment_image(segment_image_path: str) -> list[str]:
    """Extract detected car parts from segmentation image."""

    if not segment_image_path:
        return []

    try:
        img = Image.open(segment_image_path).convert("RGB")
        arr = np.array(img)

        uniq = np.unique(arr.reshape(-1, 3), axis=0)

        parts = []

        for rgb in uniq:
            tup = (int(rgb[0]), int(rgb[1]), int(rgb[2]))

            if tup in COLOR_TO_CLASS:
                name = COLOR_TO_CLASS[tup]

                if name != "_background_":
                    parts.append(name)

        return sorted(set(parts))

    except Exception:
        return []


# ---------------------------------------------------
# Infer side from parts
# ---------------------------------------------------
def orientation_from_parts(parts: list[str]) -> str:
    """Infer car orientation from detected parts."""

    # Normalize parts list (lowercase + clean)
    p = set(str(x).strip().lower() for x in parts)

    # Define keywords for rear side parts
    rear_keywords = {
        "trunk",
        "back_bumper",
        "tailgate",
        "back_left_light",
        "back_right_light",
        "back_glass",
    }

    # Define keywords for front side parts
    front_keywords = {
        "hood",
        "front_bumper",
        "front_left_light",
        "front_right_light",
        "front_glass",
    }
    
    # Count matching parts for each side
    rear_score = sum(1 for k in rear_keywords if k in p)
    front_score = sum(1 for k in front_keywords if k in p)

    # Check side mirrors for left/right
    left_score = 1 if "left_mirror" in p else 0
    right_score = 1 if "right_mirror" in p else 0

    # Determine orientation based on scores
    if rear_score >= 2 and rear_score > front_score:
        return "rear"

    if front_score >= 2 and front_score > rear_score:
        return "front"

    if left_score == 1 and right_score == 0:
        return "left"

    if right_score == 1 and left_score == 0:
        return "right"

    return "unknown"


# ---------------------------------------------------
# Main verification
# ---------------------------------------------------
def verify_damage_location(
    image_path: str,
    najm_damage_area: str,
    api_conf_min: float = 0.50,
) -> dict[str, Any]:

    najm_side = normalize_side(najm_damage_area)
    errors: list[str] = []

    # ---------------------------
    # Orientation API
    # ---------------------------

    # Run orientation detection model on the uploaded image
    api_result = run_orientation_api(image_path, api_conf_min)

    # Extract and normalize API prediction result
    api_side = normalize_side(api_result.get("orientation", "unknown"))
    api_confidence = float(api_result.get("confidence", 0.0) or 0.0)
    
    # Store API errors if any
    if api_result.get("error"):
        errors.append(api_result["error"])

    # Accept the image if Najm side matches API predicted side
    if is_side_match(najm_side, api_side):
        return {
            "status": "accepted",
            "accepted_side": najm_side,
            "accepted_source": "api",
            "najm_damage_area": najm_side,
            "api_damage_area": api_side,
            "api_confidence": api_confidence,
            "part_damage_area": "not_used",
            "detected_parts": [],
            "rejection_reason": None,
            "errors": errors,
        }

    # ---------------------------
    # HF fallback
    # ---------------------------

    # Run HuggingFace segmentation model as fallback
    _, segment_img_path = run_parts_segmentation_hf(image_path)

    # Extract detected parts from segmented image
    detected_parts = extract_parts_from_segment_image(segment_img_path)
    part_side = orientation_from_parts(detected_parts)

    # Handle segmentation failure
    if segment_img_path is None:
        errors.append("hf_parts_failed")

    # Accept if Najm side matches parts-based orientation
    if is_side_match(najm_side, part_side):
        return {
            "status": "accepted",
            "accepted_side": najm_side,
            "accepted_source": "hf_parts",
            "najm_damage_area": najm_side,
            "api_damage_area": api_side,
            "api_confidence": api_confidence,
            "part_damage_area": part_side,
            "detected_parts": detected_parts,
            "rejection_reason": None,
            "errors": errors,
        }

    # ---------------------------
    # Reject
    # ---------------------------

    # Determine rejection reason if no match
    rejection_reason = "side_mismatch"

    # Update rejection reason if both methods failed to detect orientation
    if api_side == "unknown" and part_side == "unknown":
        rejection_reason = "orientation_unknown"

    # Return final rejection result
    return {
        "status": "rejected",
        "accepted_side": None,
        "accepted_source": "none",
        "najm_damage_area": najm_side,
        "api_damage_area": api_side,
        "api_confidence": api_confidence,
        "part_damage_area": part_side,
        "detected_parts": detected_parts,
        "rejection_reason": rejection_reason,
        "errors": errors,
    }