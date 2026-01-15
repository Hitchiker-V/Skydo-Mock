from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import crud
import models
import database
from . import auth
from .webhooks import handle_payment_received, PaymentReceivedPayload

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
    sender_name: Optional[str] = None

@router.post("/onboard")
def onboard_user(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    user = crud.set_user_onboarding_status(db, user_id=current_user.id, status=True)
    return {"message": "User successfully onboarded to mock payments", "user": user}

@router.post("/trigger-payment")
def trigger_payment(payment: PaymentTrigger, db: Session = Depends(get_db)):
    """
    Triggers a mock payment by simulating a bank webhook.
    This endpoint now uses the V1 FX Engine for realistic payment processing.
    """
    invoice = crud.get_invoice_by_link_id(db, payment_link_id=payment.payment_link_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if payment.status == "success":
        # Construct webhook payload as if from a bank
        webhook_payload = PaymentReceivedPayload(
            sender_name=payment.sender_name or "Mock Payer Inc.",
            amount=invoice.total_amount,
            currency=invoice.currency or "USD",
            reference=invoice.payment_link_id
        )

        
        # Delegate to webhook handler (V1 FX flow)
        return handle_payment_received(webhook_payload, db)
    else:
        invoice.status = "failed"
        db.commit()
        return {"message": "Payment failed"}

@router.post("/process-settlements")
def process_settlements(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Simulates the 'Local-Out' settlement layer.
    Moves all PROCESSING transactions for the user to SETTLED.
    """
    transactions = db.query(models.Transaction).join(models.Invoice).filter(
        models.Invoice.owner_id == current_user.id,
        models.Transaction.settlement_status == "PROCESSING"
    ).all()
    
    count = 0
    for tx in transactions:
        tx.settlement_status = "SETTLED"
        count += 1
    
    db.commit()
    return {"message": f"Successfully settled {count} transactions via NEFT/IMPS mock service."}



