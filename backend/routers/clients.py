from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
import models
import database
from . import auth

router = APIRouter(
    prefix="/clients",
    tags=["clients"],
    dependencies=[Depends(auth.get_current_user)],
    responses={404: {"description": "Not found"}},
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Client)
def create_client(client: schemas.ClientCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_client(db=db, client=client, user_id=current_user.id)

@router.get("/", response_model=List[schemas.Client])
def read_clients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    clients = crud.get_clients(db, user_id=current_user.id, skip=skip, limit=limit)
    return clients

@router.get("/{client_id}", response_model=schemas.Client)
def read_client(client_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_client = crud.get_client(db, client_id=client_id, user_id=current_user.id)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client

@router.put("/{client_id}", response_model=schemas.Client)
def update_client(client_id: int, client: schemas.ClientCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_client = crud.update_client(db, client_id=client_id, client=client, user_id=current_user.id)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client

@router.delete("/{client_id}", response_model=schemas.Client)
def delete_client(client_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_client = crud.delete_client(db, client_id=client_id, user_id=current_user.id)
    if db_client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client
