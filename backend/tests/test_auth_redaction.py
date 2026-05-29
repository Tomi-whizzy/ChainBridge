"""Tests for the API key redaction helper in auth middleware."""

from app.middleware.auth import redact_api_key


def test_redact_normal_key_masks_middle():
    key = "cb_supersecretapikey1234"
    result = redact_api_key(key)
    assert result.startswith("cb_")
    assert result.endswith("1234")
    assert "supersecret" not in result
    assert "***" in result


def test_redact_preserves_first_and_last_chars():
    key = "ABCDEFGHIJKLMNOP"
    result = redact_api_key(key)
    assert result[:3] == "ABC"
    assert result[-4:] == "MNOP"


def test_redact_short_key_returns_placeholder():
    assert redact_api_key("short") == "***"
    assert redact_api_key("12345678") == "***"


def test_redact_empty_string_returns_placeholder():
    assert redact_api_key("") == "***"


def test_redact_does_not_leak_full_key():
    key = "cb_verylongandtopsecrethunter2"
    result = redact_api_key(key)
    assert key not in result
    assert key[3:-4] not in result
