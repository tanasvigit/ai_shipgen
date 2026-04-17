from pydantic import BaseModel


class OrderCreate(BaseModel):
    pickupLocation: str
    dropLocation: str
    load: str
    date: str


class OrderResponse(BaseModel):
    id: int
    pickupLocation: str
    dropLocation: str
    load: str
    date: str

    class Config:
        from_attributes = True


class DriverResponse(BaseModel):
    id: int
    name: str
    currentLocation: str
    availability: bool


class TripCreateRequest(BaseModel):
    orderId: int


class TripAssignRequest(BaseModel):
    tripId: int


class TripResponse(BaseModel):
    id: int
    orderId: int
    driverId: int | None
    status: str
    currentLat: float
    currentLng: float
    lastUpdated: str | None


class ApproveTripResponse(BaseModel):
    id: int
    status: str


class TripLocationUpdate(BaseModel):
    lat: float
    lng: float


class AlertResponse(BaseModel):
    id: int
    tripId: int
    type: str
    message: str
    resolved: bool
    createdAt: str | None
