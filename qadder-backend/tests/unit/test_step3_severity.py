import pytest
from app.services.step3_severity import predict_step3_severity


# Fake response class for mocking requests.post
class FakeResponse:
    def __init__(self, status_code=200, json_data=None, text=""):
        self.status_code = status_code
        self._json_data = json_data
        self.text = text

    def json(self):
        if isinstance(self._json_data, Exception):
            raise self._json_data
        return self._json_data


# Test 1: Successful severity prediction
def test_predict_step3_severity_success(mocker, tmp_path):
    image = tmp_path / "image.png"
    image.write_bytes(b"fake image content")

    mocker.patch(
        "app.services.step3_severity.STEP3_SEVERITY_API_URL",
        "http://fake-api.com/predict",
    )

    mocker.patch(
        "app.services.step3_severity.requests.post",
        return_value=FakeResponse(
            status_code=200,
            json_data={
                "status": "predicted",
                "message": "success",
                "errors": [],
                "prediction": {
                    "raw_label": "medium",
                    "severity": {"en": "medium", "ar": "متوسط"},
                    "confidence": 0.92,
                    "probabilities": {"low": 0.05, "medium": 0.92, "high": 0.03},
                },
            },
        ),
    )

    result = predict_step3_severity(str(image))

    assert result["status"] == "predicted"
    assert result["prediction"]["severity"]["en"] == "medium"
    assert result["prediction"]["confidence"] == 0.92



# Test 2: Image file does not exist
def test_predict_step3_severity_image_not_found(mocker):
    mocker.patch(
        "app.services.step3_severity.STEP3_SEVERITY_API_URL",
        "http://fake-api.com/predict",
    )

    with pytest.raises(FileNotFoundError):
        predict_step3_severity("not_found.png")


# Test 3: API returns non-200 status code
def test_predict_step3_severity_api_failure(mocker, tmp_path):
    image = tmp_path / "image.png"
    image.write_bytes(b"fake image content")

    mocker.patch(
        "app.services.step3_severity.STEP3_SEVERITY_API_URL",
        "http://fake-api.com/predict",
    )

    mocker.patch(
        "app.services.step3_severity.requests.post",
        return_value=FakeResponse(
            status_code=500,
            json_data={"detail": "server error"},
            text="server error",
        ),
    )

    with pytest.raises(RuntimeError) as exc:
        predict_step3_severity(str(image))

    assert "Step3 API failed" in str(exc.value)


# Test 4: API returns invalid JSON
def test_predict_step3_severity_invalid_json(mocker, tmp_path):
    image = tmp_path / "image.png"
    image.write_bytes(b"fake image content")

    mocker.patch(
        "app.services.step3_severity.STEP3_SEVERITY_API_URL",
        "http://fake-api.com/predict",
    )

    mocker.patch(
        "app.services.step3_severity.requests.post",
        return_value=FakeResponse(
            status_code=200,
            json_data=Exception("invalid json"),
        ),
    )

    with pytest.raises(RuntimeError) as exc:
        predict_step3_severity(str(image))

    assert "Invalid JSON returned from Step3 API" in str(exc.value)


# Test 5: API returns unexpected response format
def test_predict_step3_severity_unexpected_format(mocker, tmp_path):
    image = tmp_path / "image.png"
    image.write_bytes(b"fake image content")

    mocker.patch(
        "app.services.step3_severity.STEP3_SEVERITY_API_URL",
        "http://fake-api.com/predict",
    )

    mocker.patch(
        "app.services.step3_severity.requests.post",
        return_value=FakeResponse(
            status_code=200,
            json_data={
                "message": "missing prediction key"
            },
        ),
    )

    with pytest.raises(RuntimeError) as exc:
        predict_step3_severity(str(image))

    assert "Unexpected Step3 API response format" in str(exc.value)