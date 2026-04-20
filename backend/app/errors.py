from __future__ import annotations

from dataclasses import dataclass
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


@dataclass(slots=True)
class DomainError(Exception):
    status: int
    code: str
    message: str
    category: str
    details: dict[str, Any] | None = None
    retryable: bool = False

    def __str__(self) -> str:  # pragma: no cover - convenience for logs
        return f"{self.code}: {self.message}"


LEGACY_DETAIL_MAP: dict[str, tuple[str, str, str]] = {
    "Invalid username or password": ("AUTH_INVALID_CREDENTIALS", "Sign-in failed. Check your username and password.", "auth"),
    "Authentication required": ("AUTH_REQUIRED", "Please sign in to continue.", "auth"),
    "Invalid or expired token": ("AUTH_INVALID_TOKEN", "Your session expired. Please sign in again.", "auth"),
    "User not found": ("AUTH_INVALID_TOKEN", "Your session expired. Please sign in again.", "auth"),
    "Insufficient role": ("AUTH_FORBIDDEN", "You do not have access to this action.", "authorization"),
    "Driver profile is not linked": ("DRIVER_PROFILE_MISSING", "Your driver profile is not linked. Contact operations.", "authorization"),
    "Driver is not assigned to this trip": ("DRIVER_NOT_ASSIGNED", "This trip is assigned to another driver account.", "authorization"),
    "Trip not found": ("TRIP_NOT_FOUND", "We could not find that trip.", "not_found"),
    "Order not found": ("ORDER_NOT_FOUND", "We could not find that order.", "not_found"),
    "Alert not found": ("ALERT_NOT_FOUND", "We could not find that alert.", "not_found"),
    "Invalid tracking token": ("TRACKING_INVALID_TOKEN", "This tracking link is invalid or has expired.", "auth"),
}


def _category_for_status(status: int) -> str:
    if status in (401,):
        return "auth"
    if status in (403,):
        return "authorization"
    if status in (404,):
        return "not_found"
    if status in (409,):
        return "business_rule"
    if status in (422,):
        return "validation"
    return "system"


def _message_for_status(status: int) -> str:
    fallback: dict[int, str] = {
        401: "Please sign in to continue.",
        403: "You do not have permission for this action.",
        404: "Requested resource was not found.",
        409: "This action is not allowed right now.",
        422: "Some input values are invalid.",
    }
    return fallback.get(status, "Something went wrong. Please try again.")


def _normalize_http_detail(exc: HTTPException) -> tuple[str, str, str, dict[str, Any] | None, bool]:
    detail = exc.detail
    if isinstance(detail, dict):
        if "code" in detail and "message" in detail:
            return (
                str(detail["code"]),
                str(detail["message"]),
                str(detail.get("category") or _category_for_status(exc.status_code)),
                detail.get("details") if isinstance(detail.get("details"), dict) else None,
                bool(detail.get("retryable", False)),
            )
        if "detail" in detail and isinstance(detail["detail"], str):
            maybe = LEGACY_DETAIL_MAP.get(detail["detail"])
            if maybe is not None:
                code, message, category = maybe
                return code, message, category, None, False
    if isinstance(detail, str):
        maybe = LEGACY_DETAIL_MAP.get(detail)
        if maybe is not None:
            code, message, category = maybe
            return code, message, category, None, False
        slug = detail.upper().replace(" ", "_").replace("-", "_")
        code = f"HTTP_{exc.status_code}_{slug}"[:64]
        return code, detail, _category_for_status(exc.status_code), None, False
    return (
        f"HTTP_{exc.status_code}",
        _message_for_status(exc.status_code),
        _category_for_status(exc.status_code),
        None,
        False,
    )


def _build_error_response(
    *,
    status: int,
    code: str,
    message: str,
    category: str,
    details: dict[str, Any] | None,
    request_id: str | None,
    retryable: bool,
) -> JSONResponse:
    body = {
        "detail": message,  # backwards compatible for existing clients
        "error": {
            "code": code,
            "message": message,
            "category": category,
            "status": status,
            "details": details or {},
            "requestId": request_id,
            "retryable": retryable,
        },
    }
    return JSONResponse(status_code=status, content=body)


def raise_api_error(
    *,
    status: int,
    code: str,
    message: str,
    category: str | None = None,
    details: dict[str, Any] | None = None,
    retryable: bool = False,
) -> None:
    raise HTTPException(
        status_code=status,
        detail={
            "code": code,
            "message": message,
            "category": category or _category_for_status(status),
            "details": details or {},
            "retryable": retryable,
        },
    )


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def _handle_domain_error(request: Request, exc: DomainError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        return _build_error_response(
            status=exc.status,
            code=exc.code,
            message=exc.message,
            category=exc.category,
            details=exc.details,
            request_id=request_id,
            retryable=exc.retryable,
        )

    @app.exception_handler(HTTPException)
    async def _handle_http_exception(request: Request, exc: HTTPException) -> JSONResponse:
        code, message, category, details, retryable = _normalize_http_detail(exc)
        request_id = getattr(request.state, "request_id", None)
        return _build_error_response(
            status=exc.status_code,
            code=code,
            message=message,
            category=category,
            details=details,
            request_id=request_id,
            retryable=retryable,
        )

    @app.exception_handler(RequestValidationError)
    async def _handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        fields: list[dict[str, Any]] = []
        for issue in exc.errors():
            fields.append({"path": list(issue.get("loc", [])), "message": issue.get("msg", "Invalid value")})
        return _build_error_response(
            status=422,
            code="VALIDATION_ERROR",
            message="Some input values are invalid.",
            category="validation",
            details={"fields": fields},
            request_id=request_id,
            retryable=False,
        )

    @app.exception_handler(Exception)
    async def _handle_generic_error(request: Request, _: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", None)
        return _build_error_response(
            status=500,
            code="INTERNAL_ERROR",
            message=HTTPStatus.INTERNAL_SERVER_ERROR.phrase + ". Please try again.",
            category="system",
            details=None,
            request_id=request_id,
            retryable=True,
        )
