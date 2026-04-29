import pytest
from app.services.step2_damage_location import verify_damage_location


# Test 1: Accepted when API side matches Najm side
def test_verify_damage_location_api_accepted(mocker):
    mocker.patch(
        "app.services.step2_damage_location.run_orientation_api",
        return_value={
            "orientation": "front",
            "confidence": 0.90,
            "error": None,
        },
    )

    result = verify_damage_location("fake_image.png", "front")

    assert result["status"] == "accepted"
    assert result["accepted_source"] == "api"
    assert result["accepted_side"] == "front"


# Test 2: Accepted by HF fallback when API mismatches
def test_verify_damage_location_hf_fallback_accepted(mocker):
    mocker.patch(
        "app.services.step2_damage_location.run_orientation_api",
        return_value={
            "orientation": "rear",
            "confidence": 0.85,
            "error": None,
        },
    )

    mocker.patch(
        "app.services.step2_damage_location.run_parts_segmentation_hf",
        return_value=(None, "fake_segment.png"),
    )

    mocker.patch(
        "app.services.step2_damage_location.extract_parts_from_segment_image",
        return_value=["front_bumper", "hood", "front_left_light"],
    )

    mocker.patch(
        "app.services.step2_damage_location.orientation_from_parts",
        return_value="front",
    )

    result = verify_damage_location("fake_image.png", "front")

    assert result["status"] == "accepted"
    assert result["accepted_source"] == "hf_parts"
    assert result["part_damage_area"] == "front"


# Test 3: Rejected when API and HF do not match Najm side
def test_verify_damage_location_side_mismatch(mocker):
    mocker.patch(
        "app.services.step2_damage_location.run_orientation_api",
        return_value={
            "orientation": "rear",
            "confidence": 0.80,
            "error": None,
        },
    )

    mocker.patch(
        "app.services.step2_damage_location.run_parts_segmentation_hf",
        return_value=(None, "fake_segment.png"),
    )

    mocker.patch(
        "app.services.step2_damage_location.extract_parts_from_segment_image",
        return_value=["right_mirror"],
    )

    mocker.patch(
        "app.services.step2_damage_location.orientation_from_parts",
        return_value="right",
    )

    result = verify_damage_location("fake_image.png", "front")

    assert result["status"] == "rejected"
    assert result["rejection_reason"] == "side_mismatch"


# Test 4: Rejected when both API and HF return unknown
def test_verify_damage_location_orientation_unknown(mocker):
    mocker.patch(
        "app.services.step2_damage_location.run_orientation_api",
        return_value={
            "orientation": "unknown",
            "confidence": 0.0,
            "error": None,
        },
    )

    mocker.patch(
        "app.services.step2_damage_location.run_parts_segmentation_hf",
        return_value=(None, None),
    )

    mocker.patch(
        "app.services.step2_damage_location.extract_parts_from_segment_image",
        return_value=[],
    )

    mocker.patch(
        "app.services.step2_damage_location.orientation_from_parts",
        return_value="unknown",
    )

    result = verify_damage_location("fake_image.png", "front")

    assert result["status"] == "rejected"
    assert result["rejection_reason"] == "orientation_unknown"
    assert "hf_parts_failed" in result["errors"]


# Test 5: Najm side normalization works
def test_verify_damage_location_normalizes_back_to_rear(mocker):
    mocker.patch(
        "app.services.step2_damage_location.run_orientation_api",
        return_value={
            "orientation": "rear",
            "confidence": 0.90,
            "error": None,
        },
    )

    result = verify_damage_location("fake_image.png", "back")

    assert result["status"] == "accepted"
    assert result["accepted_side"] == "rear"