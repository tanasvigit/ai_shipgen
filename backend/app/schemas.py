from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    accessToken: str
    role: str
    driverId: int | None = None


class VehicleResponse(BaseModel):
    id: int
    name: str
    type: str
    capacityKg: float
    available: bool


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
    vehicleId: int | None = None
    vehicle: VehicleResponse | None = None
    primaryRoute: dict | None = None
    alternateRoutes: list[dict] | None = None
    eta: str | None = None
    delayRisk: float | None = None
    etaConfidence: float | None = None
    finance: dict | None = None


class PublicTrackingResponse(BaseModel):
    id: int
    status: str
    currentLat: float
    currentLng: float
    eta: str | None = None
    delayRisk: float | None = None
    lastUpdated: str | None = None
    order: OrderResponse | None = None


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
    recommendedAction: str | None = None
    reason: str | None = None
    resolved: bool
    createdAt: str | None


class FinanceResponse(BaseModel):
    fuelCost: float
    driverCost: float
    tollCost: float
    miscCost: float
    revenue: float
    profit: float


class FinanceSummaryResponse(BaseModel):
    tripCount: int
    totalRevenue: float
    totalCost: float
    totalProfit: float
    avgProfitPerTrip: float


class IngestionRequest(BaseModel):
    rawText: str


class ChannelIngestionRequest(BaseModel):
    message: str
    sourceId: str | None = None


class ModelEvaluationRecord(BaseModel):
    modelName: str
    version: str
    metrics: dict
    notes: str | None = None


class ModelEvaluationResponse(BaseModel):
    id: int
    modelName: str
    version: str
    metrics: dict | None
    notes: str | None
    createdAt: str | None


class OfflineCycleRequest(BaseModel):
    runLabel: str | None = None


class DriverIssueReportRequest(BaseModel):
    message: str
