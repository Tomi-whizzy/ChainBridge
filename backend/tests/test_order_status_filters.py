import pytest
from fastapi import HTTPException

from app.routes.orders import validate_order_status_filter


def test_valid_order_status_filter_is_normalized():
    assert validate_order_status_filter("OPEN") == "open"


def test_missing_order_status_filter_is_allowed():
    assert validate_order_status_filter(None) is None


def test_invalid_order_status_filter_returns_clear_client_error():
    with pytest.raises(HTTPException) as exc:
        validate_order_status_filter("unknown")

    assert exc.value.status_code == 400
    assert "Invalid order status 'unknown'" in exc.value.detail
    assert "Allowed values" in exc.value.detail
