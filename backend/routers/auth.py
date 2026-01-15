from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError
from typing import List
import crud
import models
import schemas
import security
import database

router = APIRouter()

# Dependency to get the database session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

@router.post("/auth/register", response_model=schemas.User)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = crud.create_user(db=db, user=user)
    
    # Auto-provision a default USD Virtual Account for new users
    crud.provision_default_virtual_account(db, new_user.id)
    
    return new_user

@router.post("/auth/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(
        data={"sub": user.email}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/users/me/virtual-accounts", response_model=List[schemas.VirtualAccount])
async def get_my_virtual_accounts(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all Virtual Accounts for the current user."""
    return crud.get_virtual_accounts_by_user(db, current_user.id)

from pydantic import BaseModel

class VACreateRequest(BaseModel):
    currency: str


@router.post("/users/me/virtual-accounts", response_model=schemas.VirtualAccount)
async def request_new_virtual_account(
    request: VACreateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request a new Virtual Account for a specific currency."""
    # Check if already exists
    existing_vas = crud.get_virtual_accounts_by_user(db, current_user.id)
    if any(va.currency == request.currency.upper() for va in existing_vas):
        raise HTTPException(status_code=400, detail=f"Virtual Account for {request.currency.upper()} already exists.")
    
    new_va = crud.provision_virtual_account(db, current_user.id, request.currency)
    if not new_va:
        raise HTTPException(status_code=400, detail=f"Currency {request.currency} not supported for Virtual Accounts.")
    
    return new_va

@router.put("/users/me/profile", response_model=schemas.User)
async def update_user_profile(
    profile: schemas.UserProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update the user's business profile for GST compliance."""
    current_user.business_name = profile.business_name
    current_user.gstin = profile.gstin
    current_user.business_address = profile.business_address
    db.commit()
    db.refresh(current_user)
    return current_user



