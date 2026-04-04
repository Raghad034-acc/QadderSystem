from __future__ import annotations

import numpy as np
from typing import Any

from gradio_client import Client
from PIL import Image


# HuggingFace Space used for parts segmentation
PARTS_SPACE = "Armandoliv/cars-parts-segmentation-resnet18"


# Class labels used in segmentation
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


# Color map used by segmentation model
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


# Map color to class name
COLOR_TO_CLASS = {COLORS[i]: C[i] for i in range(len(C))}


# Arabic names for parts
GROUP_AR = {
    "back_bumper": "الصدام الخلفي",
    "back_glass": "الزجاج الخلفي",
    "back_left_door": "الباب الخلفي الأيسر",
    "back_left_light": "إضاءة خلفية يسار",
    "back_right_door": "الباب الخلفي الأيمن",
    "back_right_light": "إضاءة خلفية يمين",
    "front_bumper": "الصدام الأمامي",
    "front_glass": "الزجاج الأمامي",
    "front_left_door": "الباب الأمامي الأيسر",
    "front_left_light": "إضاءة أمامية يسار",
    "front_right_door": "الباب الأمامي الأيمن",
    "front_right_light": "إضاءة أمامية يمين",
    "hood": "كبوت",
    "left_mirror": "المرآة اليسرى",
    "right_mirror": "المرآة اليمنى",
    "tailgate": "باب الشنطة الخلفي",
    "trunk": "الشنطة",
    "wheel": "الإطار",
}


# Virtual door glass mapping
VIRTUAL_DOOR_GLASSES = {
    "front_left_door": "front_left_door_glass",
    "front_right_door": "front_right_door_glass",
    "back_left_door": "back_left_door_glass",
    "back_right_door": "back_right_door_glass",
}


# Add Arabic labels for virtual classes
GROUP_AR.update({
    "front_left_door_glass": "زجاج الباب الأمامي الأيسر",
    "front_right_door_glass": "زجاج الباب الأمامي الأيمن",
    "back_left_door_glass": "زجاج الباب الخلفي الأيسر",
    "back_right_door_glass": "زجاج الباب الخلفي الأيمن",
})


# Light classes
LIGHT_CLASSES = {
    "front_left_light",
    "front_right_light",
    "back_left_light",
    "back_right_light",
}


# Voting thresholds
MIN_PIXELS = 250
TOP_RATIO_MIN = 0.30
MARGIN_MIN = 0.10
PAD_TRIES = [0, 20, 40]
BEST_ALLOWED_MIN_RATIO = 0.25


# Allowed classes per accepted side
ALLOWED_BY_SIDE = {
    "rear": {
        "back_bumper", "back_glass", "back_left_door", "back_right_door",
        "back_left_light", "back_right_light", "tailgate", "trunk", "wheel"
    },
    "front": {
        "front_bumper", "front_glass", "front_left_door", "front_right_door",
        "front_left_light", "front_right_light", "hood", "wheel"
    },
    "left": {
        "left_mirror", "wheel",
        "front_left_door", "back_left_door",
        "front_left_light", "back_left_light",
        "front_glass", "back_glass"
    },
    "right": {
        "right_mirror", "wheel",
        "front_right_door", "back_right_door",
        "front_right_light", "back_right_light",
        "front_glass", "back_glass"
    },
}


# Glass damage types
GLASS_DAMAGE_TYPES = {"glass shatter"}
# Rear light correction rule
# If Step2 accepted side is "rear" but model predicted front light,
# convert it to back left/right light based on bbox center position
def force_rear_light_if_needed(
    accepted_side: str | None,
    raw_name: str | None,
    bbox_xyxy: list[int],
    image_width: int,
) -> tuple[str | None, str | None]:
    if accepted_side != "rear" or not raw_name:
        return None, None

    if raw_name in ("front_left_light", "front_right_light"):
        x1, y1, x2, y2 = bbox_xyxy
        cx = (x1 + x2) / 2.0
        forced = "back_left_light" if cx < (image_width / 2.0) else "back_right_light"
        return forced, "forced_rear_light_rule(front->back by bbox center x)"

    return None, None

# Lamp broken rule
# If damage type indicates broken lamp, prefer light parts
# even if they are not the top voted part
def prefer_light_for_lamp_broken(
    matched_parts: list[tuple[str, int]],
    total_non_background: int,
    accepted_side: str | None = None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    if not matched_parts or total_non_background <= 0:
        return None, None

    allowed = None
    if accepted_side and accepted_side in ALLOWED_BY_SIDE:
        allowed = ALLOWED_BY_SIDE[accepted_side]

    for part_name, pixels in matched_parts:
        if part_name in LIGHT_CLASSES:
            if allowed is None or part_name in allowed:
                chosen = {
                    "name_en": part_name,
                    "name_ar": GROUP_AR.get(part_name, part_name),
                    "vote_ratio": float(pixels / total_non_background),
                }
                meta = {
                    "status": "side_corrected_light_rule",
                    "reason": "lamp_broken_force_light_mandatory",
                    "allowed_groups": sorted(list(allowed)) if allowed else [],
                }
                return chosen, meta

    return None, None

# Side gating logic
# Ensures predicted part is consistent with accepted side from Step2
# If not allowed, try to select best allowed alternative
def choose_with_side_gating(
    top_part: str,
    vote_ratio: float,
    matched_parts: list[tuple[str, int]],
    total_non_background: int,
    accepted_side: str | None,
    bbox_xyxy: list[int],
    image_width: int,
) -> tuple[dict[str, Any] | None, dict[str, Any]]:
    forced_name, forced_reason = force_rear_light_if_needed(
        accepted_side=accepted_side,
        raw_name=top_part,
        bbox_xyxy=bbox_xyxy,
        image_width=image_width,
    )
    if forced_name:
        return {
            "name_en": forced_name,
            "name_ar": GROUP_AR.get(forced_name, forced_name),
            "vote_ratio": vote_ratio,
        }, {
            "status": "side_corrected_light_rule",
            "reason": forced_reason,
            "allowed_groups": sorted(list(ALLOWED_BY_SIDE.get(accepted_side, []))),
        }

    if accepted_side and accepted_side in ALLOWED_BY_SIDE:
        allowed = ALLOWED_BY_SIDE[accepted_side]

        if top_part in allowed:
            return {
                "name_en": top_part,
                "name_ar": GROUP_AR.get(top_part, top_part),
                "vote_ratio": vote_ratio,
            }, {
                "status": "extracted",
                "reason": "majority_vote_inside_bbox",
                "allowed_groups": sorted(list(allowed)),
            }

        for part_name, pixels in matched_parts:
            if part_name in allowed:
                alt_ratio = float(pixels / total_non_background)
                if alt_ratio >= BEST_ALLOWED_MIN_RATIO:
                    return {
                        "name_en": part_name,
                        "name_ar": GROUP_AR.get(part_name, part_name),
                        "vote_ratio": alt_ratio,
                    }, {
                        "status": "side_corrected",
                        "reason": "top_not_allowed_pick_best_allowed",
                        "allowed_groups": sorted(list(allowed)),
                    }

        return None, {
            "status": "conflict_with_step2",
            "reason": f"accepted_side={accepted_side} but predicted={top_part} not allowed",
            "allowed_groups": sorted(list(allowed)),
        }

    return {
        "name_en": top_part,
        "name_ar": GROUP_AR.get(top_part, top_part),
        "vote_ratio": vote_ratio,
    }, {
        "status": "extracted",
        "reason": "majority_vote_inside_bbox",
        "allowed_groups": [],
    }

# Normalize trunk family
# Merge tailgate and trunk into single class "trunk"
# to avoid duplicate categories
def normalize_trunk_family(
    chosen: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, str | None]:
    if not chosen:
        return chosen, None

    name_en = (chosen.get("name_en") or "").strip().lower()
    if name_en in ("trunk", "tailgate"):
        chosen = {**chosen}
        chosen["name_en"] = "trunk"
        chosen["name_ar"] = GROUP_AR.get("trunk", "الشنطة")
        return chosen, "normalized_trunk_family(trunk|tailgate -> trunk)"

    return chosen, None

# Glass damage rule
# If damage type is glass shatter and part is door
# convert to door glass virtual class
def prefer_door_glass_for_glass_damage(
    chosen: dict[str, Any] | None,
    damage_type_en: str | None,
) -> tuple[dict[str, Any] | None, str | None]:
    if not chosen:
        return chosen, None

    damage_type_norm = (damage_type_en or "").strip().lower()
    if damage_type_norm not in GLASS_DAMAGE_TYPES:
        return chosen, None

    part_name = (chosen.get("name_en") or "").strip().lower()
    if part_name in VIRTUAL_DOOR_GLASSES:
        glass_name = VIRTUAL_DOOR_GLASSES[part_name]
        chosen = {**chosen}
        chosen["name_en"] = glass_name
        chosen["name_ar"] = GROUP_AR.get(glass_name, glass_name)
        return chosen, f"glass_damage_prefer_door_glass({part_name} -> {glass_name})"

    return chosen, None

# Apply post processing rules
# Applies:
# - glass rule
# - trunk normalization
# after main part selection
def apply_post_rules(
    chosen: dict[str, Any] | None,
    damage_type_en: str | None,
) -> tuple[dict[str, Any] | None, str | None]:
    if not chosen:
        return chosen, None

    rules: list[str] = []

    chosen, r1 = prefer_door_glass_for_glass_damage(chosen, damage_type_en)
    if r1:
        rules.append(r1)

    chosen, r2 = normalize_trunk_family(chosen)
    if r2:
        rules.append(r2)

    return chosen, "; ".join(rules) if rules else None

# Extract parts from segmentation mask
def extract_parts_from_segment_image(segment_image_path: str) -> list[str]:
    if not segment_image_path:
        return []

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


# Call HuggingFace segmentation model
def predict_step5_damage_part(image_path: str, timeout: int = 120) -> dict[str, Any]:
    try:
        client = Client(PARTS_SPACE)

        result = client.predict(
            image_path,
            api_name="/predict"
        )

        if not isinstance(result, (list, tuple)) or len(result) < 2:
            raise RuntimeError(f"Unexpected Step5 Space response: {result}")

        detected_img_path = result[0]
        segment_img_path = result[1]

        detected_parts = extract_parts_from_segment_image(segment_img_path)

        return {
            "status": "connected",
            "message": "Step5 HF Space connected successfully",
            "outputs": {
                "detected_image_path": detected_img_path,
                "segment_image_path": segment_img_path,
            },
            "detected_parts": detected_parts,
            "damages": [],
        }

    except Exception as exc:
        raise RuntimeError(f"Step5 HF Space call failed: {type(exc).__name__}: {exc}")
   
# Clip bbox coordinates to image boundaries
# Ensures bbox does not exceed image size
def clip_xyxy(x1: int, y1: int, x2: int, y2: int, w: int, h: int) -> tuple[int, int, int, int]:
    x1 = max(0, min(w - 1, int(x1)))
    y1 = max(0, min(h - 1, int(y1)))
    x2 = max(0, min(w, int(x2)))
    y2 = max(0, min(h, int(y2)))

    if x2 <= x1:
        x2 = min(w, x1 + 1)
    if y2 <= y1:
        y2 = min(h, y1 + 1)

    return x1, y1, x2, y2

# Add padding to bbox
# Used for multi-padding voting
def pad_xyxy(x1: int, y1: int, x2: int, y2: int, pad: int) -> tuple[int, int, int, int]:
    return x1 - pad, y1 - pad, x2 + pad, y2 + pad

# Extract parts and pixel counts from cropped segmentation area
# Returns matched parts and total non background pixels
def build_matched_parts_from_crop(crop: np.ndarray) -> tuple[list[tuple[str, int]], int]:
    pixels = crop.reshape(-1, 3)
    uniq, counts = np.unique(pixels, axis=0, return_counts=True)

    matched_parts: list[tuple[str, int]] = []
    total_non_background = 0

    for rgb, count in zip(uniq, counts):
        color = tuple(int(v) for v in rgb)
        part_name = COLOR_TO_CLASS.get(color)

        if part_name and part_name != "_background_":
            matched_parts.append((part_name, int(count)))
            total_non_background += int(count)

    matched_parts.sort(key=lambda x: x[1], reverse=True)
    return matched_parts, total_non_background

# Voting logic inside bbox
# Performs majority voting on cropped segmentation
# Applies thresholds to determine:
# extracted / ambiguous / failed
def vote_group_from_crop(
    arr: np.ndarray,
    bbox_xyxy: list[int],
    pad_px: int,
) -> dict[str, Any]:
    h, w = arr.shape[:2]

    x1, y1, x2, y2 = bbox_xyxy
    x1, y1, x2, y2 = pad_xyxy(x1, y1, x2, y2, pad_px)
    x1, y1, x2, y2 = clip_xyxy(x1, y1, x2, y2, w, h)

    crop = arr[y1:y2, x1:x2]
    if crop.size == 0:
        return {
            "status": "failed",
            "reason": "empty_bbox_region",
            "bbox_xyxy_used": [x1, y1, x2, y2],
            "pad_px": pad_px,
        }

    matched_parts, total_non_background = build_matched_parts_from_crop(crop)

    if not matched_parts or total_non_background == 0:
        return {
            "status": "failed",
            "reason": "bbox_all_background",
            "bbox_xyxy_used": [x1, y1, x2, y2],
            "pad_px": pad_px,
            "non_bg_pixels": 0,
        }

    dist = []
    for part_name, pixels in matched_parts:
        dist.append({
            "name": part_name,
            "pixels": pixels,
            "ratio": float(pixels / total_non_background),
        })

    top = dist[0]
    second = dist[1] if len(dist) > 1 else {"name": None, "pixels": 0, "ratio": 0.0}

    if total_non_background < MIN_PIXELS:
        status = "ambiguous"
        reason = "too_few_non_bg_pixels"
    elif top["ratio"] >= TOP_RATIO_MIN and (top["ratio"] - second["ratio"]) >= MARGIN_MIN:
        status = "extracted"
        reason = None
    else:
        status = "ambiguous"
        reason = "weak_majority_or_small_margin"

    return {
        "status": status,
        "reason": reason,
        "bbox_xyxy_used": [x1, y1, x2, y2],
        "pad_px": pad_px,
        "non_bg_pixels": total_non_background,
        "matched_parts": matched_parts,
        "top": top,
        "second": second,
        "dist_top6": dist[:6],
    }

# Score voting result
# Used to select best vote among multi padding attempts
def score_vote(vote_obj: dict[str, Any]) -> float:
    if vote_obj.get("status") == "failed":
        return -1e9

    top = vote_obj.get("top") or {}
    second = vote_obj.get("second") or {}

    top_ratio = float(top.get("ratio", 0.0))
    second_ratio = float(second.get("ratio", 0.0))
    non_bg = float(vote_obj.get("non_bg_pixels", 0.0))
    margin = max(0.0, top_ratio - second_ratio)

    return top_ratio + 0.30 * margin + 1e-5 * non_bg

def detect_part_in_bbox(
    segment_image_path: str,
    bbox_x1: int,
    bbox_y1: int,
    bbox_x2: int,
    bbox_y2: int,
    accepted_side: str | None = None,
    damage_type_en: str | None = None,
) -> dict[str, Any]:
    """
    Detect the dominant car part inside the given bbox using the segmentation image.
    Enhanced version:
    - applies multi-padding voting
    - applies side gating
    - applies rear-light correction
    - applies lamp-broken rule
    - applies glass rule
    - applies trunk normalization
    """

    if not segment_image_path:
        return {
            "part_name_en": "unknown",
            "part_name_ar": "غير معروف",
            "vote_ratio": 0.0,
            "vote_label": "low",
            "part_status": "failed",
            "part_reason": "missing_segment_image",
            "part_method": "bbox_mask_vote + side_gate + multi_pad",
            "part_post_rules": None,
            "quality_status": "failed",
            "allowed_groups": [],
        }

    img = Image.open(segment_image_path).convert("RGB")
    arr = np.array(img)
    h, w = arr.shape[:2]

    x1 = max(0, min(w - 1, int(bbox_x1)))
    y1 = max(0, min(h - 1, int(bbox_y1)))
    x2 = max(0, min(w, int(bbox_x2)))
    y2 = max(0, min(h, int(bbox_y2)))

    if x2 <= x1 or y2 <= y1:
        return {
            "part_name_en": "unknown",
            "part_name_ar": "غير معروف",
            "vote_ratio": 0.0,
            "vote_label": "low",
            "part_status": "failed",
            "part_reason": "invalid_bbox",
            "part_method": "bbox_mask_vote + side_gate + multi_pad",
            "part_post_rules": None,
            "quality_status": "failed",
            "allowed_groups": [],
        }

    raw_bbox = [x1, y1, x2, y2]
    # Multi-padding voting
    # Try different bbox paddings and choose best vote
    votes = [vote_group_from_crop(arr, raw_bbox, pad_px=p) for p in PAD_TRIES]
    best_vote = max(votes, key=score_vote)

    if best_vote.get("status") == "failed":
        return {
            "part_name_en": "unknown",
            "part_name_ar": "غير معروف",
            "vote_ratio": 0.0,
            "vote_label": "low",
            "part_status": "failed",
            "part_reason": best_vote.get("reason", "vote_failed"),
            "part_method": "bbox_mask_vote + side_gate + multi_pad",
            "part_post_rules": None,
            "quality_status": "failed",
            "allowed_groups": [],
        }

    matched_parts = best_vote["matched_parts"]
    total_non_background = best_vote["non_bg_pixels"]
    top_part = best_vote["top"]["name"]
    vote_ratio = float(best_vote["top"]["ratio"])

    if best_vote.get("status") == "ambiguous":
        allowed_groups = (
            sorted(list(ALLOWED_BY_SIDE.get(accepted_side, [])))
            if accepted_side in ALLOWED_BY_SIDE
            else []
        )
        return {
            "part_name_en": top_part or "unknown",
            "part_name_ar": GROUP_AR.get(top_part, "غير معروف") if top_part else "غير معروف",
            "vote_ratio": vote_ratio,
            "vote_label": "low",
            "part_status": "ambiguous",
            "part_reason": best_vote.get("reason", "weak_majority_or_small_margin"),
            "part_method": "bbox_mask_vote + side_gate + multi_pad",
            "part_post_rules": None,
            "quality_status": "ambiguous",
            "allowed_groups": allowed_groups,
        }

    chosen = None
    meta = None
    # Apply lamp broken rule if damage type indicates broken light
    damage_type_norm = (damage_type_en or "").strip().lower()
    if damage_type_norm in ("lamp broken", "light broken", "broken lamp"):
        chosen, meta = prefer_light_for_lamp_broken(
            matched_parts=matched_parts,
            total_non_background=total_non_background,
            accepted_side=accepted_side,
        )
    # Apply side gating if lamp rule not triggered
    if chosen is None:
        chosen, meta = choose_with_side_gating(
            top_part=top_part,
            vote_ratio=vote_ratio,
            matched_parts=matched_parts,
            total_non_background=total_non_background,
            accepted_side=accepted_side,
            bbox_xyxy=best_vote["bbox_xyxy_used"],
            image_width=w,
        )
    
    # Apply post rules after selecting final part
    post_rules = None
    chosen, post_rules = apply_post_rules(chosen, damage_type_en)
    
    if chosen is None:
        return {
            "part_name_en": "unknown",
            "part_name_ar": "غير معروف",
            "vote_ratio": vote_ratio,
            "vote_label": "low",
            "part_status": meta.get("status", "conflict_with_step2"),
            "part_reason": meta.get("reason", "part_not_allowed"),
            "part_method": "bbox_mask_vote + side_gate + multi_pad",
            "part_post_rules": post_rules,
            "quality_status": meta.get("status", "conflict_with_step2"),
            "allowed_groups": meta.get("allowed_groups", []),
        }

    final_part_name_en = chosen["name_en"]
    final_part_name_ar = chosen["name_ar"]
    final_vote_ratio = float(chosen["vote_ratio"])
    # Assign confidence label based on vote ratio
    vote_label = "high" if final_vote_ratio >= 0.50 else "low"

    return {
        "part_name_en": final_part_name_en,
        "part_name_ar": final_part_name_ar,
        "vote_ratio": final_vote_ratio,
        "vote_label": vote_label,
        "part_status": meta.get("status", "extracted"),
        "part_reason": meta.get("reason", "majority_vote_inside_bbox"),
        "part_method": "bbox_mask_vote + side_gate + multi_pad",
        "part_post_rules": post_rules,
        "quality_status": meta.get("status", "extracted"),
        "allowed_groups": meta.get("allowed_groups", []),
    }