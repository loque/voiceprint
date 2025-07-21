from fastapi import HTTPException


class BadRequestError(HTTPException):
    """Exception raised for bad requests."""
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=detail)

class NotFoundError(HTTPException):
    """Exception raised when a resource is not found."""
    def __init__(self, detail: str):
        super().__init__(status_code=404, detail=detail)

class InternalServerError(HTTPException):
    """Exception raised for internal server errors."""
    def __init__(self, detail: str = "Internal Server Error"):
        super().__init__(status_code=500, detail=detail)