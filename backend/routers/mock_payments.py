from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import crud
import models
import database
from . import auth
from services import fulfillment

router = APIRouter(
    prefix="/mock/payments",
    tags=["mock-payments"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class PaymentTrigger(BaseModel):
    payment_link_id: str
    status: str

@router.post("/onboard")
def onboard_user(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    user = crud.set_user_onboarding_status(db, user_id=current_user.id, status=True)
    return {"message": "User successfully onboarded to mock payments", "user": user}

@router.post("/trigger-payment")
def trigger_payment(payment: PaymentTrigger, db: Session = Depends(get_db)):
    invoice = crud.get_invoice_by_link_id(db, payment_link_id=payment.payment_link_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if payment.status == "success":
        fulfillment.process_successful_payment(db, invoice)
        return {"message": "Payment successful"}
    else:
        return {"message": "Payment failed"}
