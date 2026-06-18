import httpx
import pytest

from app.services import nlp_extraction


@pytest.mark.parametrize(
    "phrase",
    [
        "Need a refrigerated truck to move 12 tons from Vizag port gate 3 to Hyderabad pharma zone by 2026-04-20.",
        "Please dispatch 8.5 tons of fragile goods from Bengaluru Whitefield to Chennai Sriperumbudur tomorrow morning.",
    ],
)
def test_openai_nlp_path_parses_json(monkeypatch, phrase: str) -> None:
    monkeypatch.setattr(nlp_extraction.settings, "nlp_provider", "openai")
    monkeypatch.setattr(nlp_extraction.settings, "openai_api_key", "test-key")
    monkeypatch.setattr(nlp_extraction.settings, "openai_model", "gpt-4o-mini")

    class FakeResponse:
        def raise_for_status(self) -> None:
            return None

        def json(self) -> dict:
            return {
                "choices": [
                    {
                        "message": {
                            "content": (
                                '{"pickupLocation":"Vizag","dropLocation":"Hyderabad","load":"10 tons",'
                                '"date":"2026-04-20","confidence":0.93}'
                            )
                        }
                    }
                ]
            }

    monkeypatch.setattr(nlp_extraction.httpx, "post", lambda *args, **kwargs: FakeResponse())
    extracted = nlp_extraction.extract_order_from_text(phrase)
    assert extracted["order"].pickupLocation == "Vizag"
    assert extracted["order"].dropLocation == "Hyderabad"
    assert extracted["order"].load == "10 tons"
    assert extracted["order"].date == "2026-04-20"
    assert extracted["confidence"] == 0.93
    assert extracted["nlpEngineUsed"] == "openai"
    assert extracted["nlpErrorReason"] is None


def test_openai_nlp_falls_back_on_failure(monkeypatch) -> None:
    monkeypatch.setattr(nlp_extraction.settings, "nlp_provider", "openai")
    monkeypatch.setattr(nlp_extraction.settings, "openai_api_key", "test-key")

    def _raise(*args, **kwargs):
        raise RuntimeError("network failure")

    monkeypatch.setattr(nlp_extraction.httpx, "post", _raise)
    extracted = nlp_extraction.extract_order_from_text("Send 10 tons from Vizag to Hyderabad tomorrow")
    assert extracted["order"].pickupLocation == "Vizag"
    assert extracted["order"].dropLocation == "Hyderabad"
    assert extracted["order"].load.lower().startswith("10")
    assert extracted["nlpEngineUsed"] == "regex"
    assert extracted["nlpErrorReason"] == "openai_unknown_error"


def test_openai_nlp_falls_back_with_timeout_reason(monkeypatch) -> None:
    monkeypatch.setattr(nlp_extraction.settings, "nlp_provider", "openai")
    monkeypatch.setattr(nlp_extraction.settings, "openai_api_key", "test-key")

    def _timeout(*args, **kwargs):
        raise httpx.TimeoutException("request timeout")

    monkeypatch.setattr(nlp_extraction.httpx, "post", _timeout)
    extracted = nlp_extraction.extract_order_from_text("Move 7 tons from Pune to Nashik tomorrow")
    assert extracted["nlpEngineUsed"] == "regex"
    assert extracted["nlpErrorReason"] == "openai_timeout"
