from app.core.config import settings
from app.services.communication import communication_readiness
from app.services.nlp_extraction import nlp_readiness
from app.services.routing import routing_readiness


def test_sandbox_readiness_is_true() -> None:
    original_comm = settings.comm_provider
    original_route = settings.route_provider
    original_nlp = settings.nlp_provider
    try:
        settings.comm_provider = "sandbox"
        settings.route_provider = "sandbox"
        settings.nlp_provider = "sandbox"
        comm = communication_readiness()
        route = routing_readiness()
        nlp = nlp_readiness()
    finally:
        settings.comm_provider = original_comm
        settings.route_provider = original_route
        settings.nlp_provider = original_nlp

    assert comm["whatsappReady"] is True
    assert comm["smsReady"] is True
    assert route["ready"] is True
    assert nlp["ready"] is True
