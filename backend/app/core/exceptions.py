from fastapi import Request
from fastapi.responses import JSONResponse


async def not_found_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": "Resource not found"})


async def forbidden_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=403, content={"detail": "Access forbidden"})
