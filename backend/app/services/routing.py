from datetime import datetime, timedelta, timezone

from ..core.config import settings


def build_route_plan(pickup: str, drop: str) -> tuple[dict, list[dict], str]:
    now = datetime.now(timezone.utc)
    base_eta = now + timedelta(hours=8)
    primary_route = {
        "name": "Primary Corridor",
        "distanceKm": 920,
        "durationMin": 480,
        "trafficLevel": "moderate",
        "pathSummary": f"{pickup} -> {drop}",
    }
    alternate_routes = [
        {"name": "Alt North", "distanceKm": 955, "durationMin": 510, "trafficLevel": "low"},
        {"name": "Alt Express", "distanceKm": 905, "durationMin": 525, "trafficLevel": "high"},
    ]
    if settings.route_provider != "sandbox":
        primary_route["provider"] = settings.route_provider
        for route in alternate_routes:
            route["provider"] = settings.route_provider
    return primary_route, alternate_routes, base_eta.isoformat()


def routing_readiness() -> dict:
    if settings.route_provider == "sandbox":
        return {"provider": settings.route_provider, "ready": True}
    return {"provider": settings.route_provider, "ready": bool(settings.mapbox_api_key)}
