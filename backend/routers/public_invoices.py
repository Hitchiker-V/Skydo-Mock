from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import crud
import schemas
import database

router = APIRouter(
    prefix="/invoices/public",
    tags=["public-invoices"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{payment_link_id}", response_model=schemas.Invoice)
def get_public_invoice(payment_link_id: str, db: Session = Depends(get_db)):
    invoice = crud.get_invoice_by_link_id(db, payment_link_id=payment_link_id)
    if invoice is None:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice
