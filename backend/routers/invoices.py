from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import crud
import schemas
import models
import database
from . import auth

router = APIRouter(
    prefix="/invoices",
    tags=["invoices"],
    dependencies=[Depends(auth.get_current_user)],
    responses={404: {"description": "Not found"}},
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.Invoice)
def create_invoice(invoice: schemas.InvoiceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Verify client belongs to user
    client = crud.get_client(db, client_id=invoice.client_id, user_id=current_user.id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    return crud.create_invoice(db=db, invoice=invoice, user_id=current_user.id)

@router.get("/", response_model=List[schemas.Invoice])
def read_invoices(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    invoices = crud.get_invoices(db, user_id=current_user.id, skip=skip, limit=limit)
    return invoices

@router.get("/{invoice_id}", response_model=schemas.Invoice)
def read_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_invoice = crud.get_invoice(db, invoice_id=invoice_id, user_id=current_user.id)
    if db_invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return db_invoice
