from .. import models


def calculate_trip_finance(trip: models.Trip) -> dict:
    distance_km = 0.0
    if isinstance(trip.primary_route, dict):
        distance_km = float(trip.primary_route.get("distanceKm", 0))
    fuel_cost = round(max(150.0, distance_km * 0.35), 2)
    driver_cost = round(max(120.0, distance_km * 0.28), 2)
    toll = round(max(20.0, distance_km * 0.06), 2)
    misc = 35.0
    revenue = round(max(1200.0, distance_km * 1.9), 2)
    total_cost = round(fuel_cost + driver_cost + toll + misc, 2)
    profit = round(revenue - total_cost, 2)
    return {
        "fuelCost": fuel_cost,
        "driverCost": driver_cost,
        "tollCost": toll,
        "miscCost": misc,
        "revenue": revenue,
        "profit": profit,
    }
