# backend/routers/webhooks.py
"""
Webhook Collection Layer

This router simulates receiving webhooks from Banking-as-a-Service providers
(e.g., Currencycloud, Banking Circle) when funds arrive in a Virtual Account.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from decimal import Decimal
import database
import models
from services import fx_engine

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Dependency to get database session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


class PaymentReceivedPayload(BaseModel):
    """Mimics a real bank webhook payload."""
    sender_name: str          # Name of the payer (for reconciliation)
    amount: Decimal           # Amount received in foreign currency
    currency: str             # e.g., "USD", "EUR"
    reference: str            # Payment Link ID or Invoice reference


@router.post("/payment-received", status_code=status.HTTP_200_OK)
def handle_payment_received(
    payload: PaymentReceivedPayload,
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint called when funds hit a Virtual Account.
    
    Flow:
    1. Find the Invoice by payment_link_id (reference)
    2. Call FX Engine to lock rate and calculate payout
    3. Create Transaction record with full FX breakdown
    4. Update Invoice status to 'paid'
    """
    # 1. Reconciliation: Find the Invoice by payment link reference
    invoice = db.query(models.Invoice).filter(
        models.Invoice.payment_link_id == payload.reference
    ).first()

    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invoice not found for reference: {payload.reference}"
        )

    if invoice.status == "paid":
        return {"message": "Invoice already paid. Ignoring duplicate webhook."}

    # 2. Treasury Lock: Calculate FX and Payout
    payout = fx_engine.calculate_payout(payload.amount, payload.currency)

    # 3. Create Transaction with full audit trail
    transaction = models.Transaction(
        invoice_id=invoice.id,
        sender_name=payload.sender_name,
        principal_amount=payout["principal_amount"],
        currency=payload.currency,
        amount=payout["net_payout_inr"],
        fx_rate=payout["fx_rate"],
        flat_fee_usd=payout["flat_fee_usd"],
        gst_on_fee_inr=payout["gst_on_fee_inr"],
        net_payout_inr=payout["net_payout_inr"],
        status="succeeded",
        settlement_status="PROCESSING", # Funds detected, now processing for local payout
    )

    db.add(transaction)

    # 4. Update Invoice status
    invoice.status = "paid"

    
    db.commit()
    db.refresh(transaction)

    return {
        "message": "Payment processed successfully.",
        "transaction_id": transaction.id,
        "net_payout_inr": str(payout["net_payout_inr"]),
        "fx_rate": str(payout["fx_rate"]),
        "settlement_status": "PENDING"
    }
