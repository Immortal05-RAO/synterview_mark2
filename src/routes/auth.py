from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.models.user import User
from src.schemas.auth import (
    UserRegister,
    UserLogin,
    TokenRefreshRequest,
    TokenResponse,
    UserResponse,
    UserMeResponse
)
from src.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_token,
    get_current_user
)
from src.middleware.error_handler import APIException

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise APIException(
            status_code=status.HTTP_409_CONFLICT,
            code="USER_ALREADY_EXISTS",
            message="User with this email already exists"
        )

    # Create new user
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate tokens
    access_token = create_access_token({"sub": new_user.id})
    refresh_token = create_refresh_token({"sub": new_user.id})

    new_user.refresh_token = hash_token(refresh_token)
    db.commit()

    return TokenResponse(
        success=True,
        accessToken=access_token,
        refreshToken=refresh_token,
        tokenType="bearer"
    )


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="INVALID_CREDENTIALS",
            message="Invalid email or password"
        )

    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})

    user.refresh_token = hash_token(refresh_token)
    db.commit()

    return TokenResponse(
        success=True,
        accessToken=access_token,
        refreshToken=refresh_token,
        tokenType="bearer"
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(token_data: TokenRefreshRequest, db: Session = Depends(get_db)):
    payload = decode_refresh_token(token_data.refreshToken)
    user_id = payload.get("sub")
    if not user_id:
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="INVALID_TOKEN",
            message="Invalid refresh token payload"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.refresh_token != hash_token(token_data.refreshToken):
        raise APIException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="INVALID_TOKEN",
            message="Refresh token is invalid or revoked"
        )

    new_access_token = create_access_token({"sub": user.id})
    new_refresh_token = create_refresh_token({"sub": user.id})

    user.refresh_token = hash_token(new_refresh_token)
    db.commit()

    return TokenResponse(
        success=True,
        accessToken=new_access_token,
        refreshToken=new_refresh_token,
        tokenType="bearer"
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.refresh_token = None
    db.commit()
    return {"success": True, "message": "Successfully logged out"}


@router.get("/me", response_model=UserMeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserMeResponse(
        success=True,
        user=UserResponse(
            id=current_user.id,
            name=current_user.name,
            email=current_user.email,
            createdAt=current_user.created_at
        )
    )
