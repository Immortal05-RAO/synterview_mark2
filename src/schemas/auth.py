from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenRefreshRequest(BaseModel):
    refreshToken: str


class TokenResponse(BaseModel):
    success: bool = True
    accessToken: str
    refreshToken: str
    tokenType: str = "bearer"


class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    createdAt: datetime

    model_config = ConfigDict(from_attributes=True)


class UserMeResponse(BaseModel):
    success: bool = True
    user: UserResponse
