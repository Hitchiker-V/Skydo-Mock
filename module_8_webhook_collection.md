# Module Plan: Webhook Collection & Settlement Layer

This document outlines the plan for implementing the webhook-driven collection layer and settlement services. This module connects the Bank/BaaS provider simulation to the internal treasury engine.

## 1. Development Plan

### 1.1. Backend Development (FastAPI)

- **New Router (`routers/webhooks.py`):**

  This endpoint simulates receiving a notification from a Banking-as-a-Service provider (e.g., Currencycloud, Banking Circle) when funds arrive in a Virtual Account.

  ```python
  # backend/routers/webhooks.py

  from fastapi import APIRouter, Depends, HTTPException, status
  from sqlalchemy.orm import Session
  from pydantic import BaseModel
  from decimal import Decimal
  import database
  import models
  from services import fx_engine

  router = APIRouter(prefix="/webhooks", tags=["webhooks"])

  class PaymentReceivedPayload(BaseModel):
      """Mimics a real bank webhook payload."""
      sender_name: str          # Name of the payer (for reconciliation)
      amount: Decimal           # Amount received in foreign currency
      currency: str             # e.g., "USD", "EUR"
      reference: str            # Payment Link ID or Invoice reference

  @router.post("/payment-received", status_code=status.HTTP_200_OK)
  def handle_payment_received(
      payload: PaymentReceivedPayload,
      db: Session = Depends(database.get_db)
  ):
      """
      Webhook endpoint called when funds hit a Virtual Account.
      
      Flow:
      1. Find the Invoice by payment_link_id (reference)
      2. Call FX Engine to lock rate and calculate payout
      3. Create Transaction record with full FX breakdown
      4. Update Invoice status to 'paid'
      5. Queue for settlement (mock)
      """
      # 1. Reconciliation: Find the Invoice
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
          settlement_status="PENDING",
      )
      db.add(transaction)

      # 4. Update Invoice status
      invoice.status = "paid"
      
      db.commit()
      db.refresh(transaction)

      # 5. (Future) Trigger async settlement job
      # settlement_service.queue_settlement(transaction.id)

      return {
          "message": "Payment processed successfully.",
          "transaction_id": transaction.id,
          "net_payout_inr": str(payout["net_payout_inr"]),
          "fx_rate": str(payout["fx_rate"])
      }
  ```

- **Register Router (`main.py`):**
  ```python
  from routers import webhooks
  app.include_router(webhooks.router)
  ```

- **Update Mock Payments (`routers/mock_payments.py`):**

  The existing trigger endpoint now constructs a webhook-like payload and calls the webhook handler logic.

  ```python
  # Modify the existing trigger endpoint
  @router.post("/trigger-payment")
  def trigger_mock_payment(
      payload: MockPaymentPayload,
      db: Session = Depends(database.get_db)
  ):
      # Find the invoice
      invoice = db.query(models.Invoice).filter(
          models.Invoice.payment_link_id == payload.payment_link_id
      ).first()
      
      if not invoice:
          raise HTTPException(status_code=404, detail="Invoice not found")

      # Construct webhook payload as if from a bank
      from routers.webhooks import handle_payment_received, PaymentReceivedPayload
      
      webhook_payload = PaymentReceivedPayload(
          sender_name=payload.sender_name if hasattr(payload, 'sender_name') else "Mock Payer Inc.",
          amount=invoice.total_amount,
          currency="USD",
          reference=invoice.payment_link_id
      )
      
      # Delegate to webhook handler
      return handle_payment_received(webhook_payload, db)
  ```

- **Settlement Service (`services/settlement.py`)** - Optional for V1:

  ```python
  # backend/services/settlement.py

  from sqlalchemy.orm import Session
  import models

  def mark_as_settled(db: Session, transaction_id: int):
      """
      Mock settlement: In production, this would call HDFC/DBS API.
      For V1, we simply update the status.
      """
      transaction = db.query(models.Transaction).filter(
          models.Transaction.id == transaction_id
      ).first()
      
      if transaction:
          transaction.settlement_status = "SETTLED"
          db.commit()
      
      return transaction
  ```

### 1.2. Frontend Development (Next.js)

- **Update Payment Simulation Page (`app/pay/[paymentLinkId]/page.tsx`):**

  - Add an optional "Sender Name" input field.
  - Pass the sender name to the trigger endpoint.

  ```typescript
  const handleSimulatePayment = async () => {
    try {
      await api.triggerMockPayment(paymentLinkId, {
        sender_name: senderName || "International Client LLC",
        status: "success"
      });
      setPaymentComplete(true);
    } catch (error) {
      console.error("Payment simulation failed:", error);
    }
  };
  ```

- **Update Invoice Detail Page (`app/invoices/[id]/page.tsx`):**

  After payment, display the FX breakdown:

  ```tsx
  {invoice.status === "paid" && transaction && (
    <div className="fx-breakdown">
      <h3>Settlement Details</h3>
      <table>
        <tr><td>Principal Received:</td><td>${transaction.principal_amount} {transaction.currency}</td></tr>
        <tr><td>Flat Fee:</td><td>-${transaction.flat_fee_usd}</td></tr>
        <tr><td>FX Rate:</td><td>₹{transaction.fx_rate} per {transaction.currency}</td></tr>
        <tr><td>GST (18% on fee):</td><td>-₹{transaction.gst_on_fee_inr}</td></tr>
        <tr className="total"><td>Net Settlement:</td><td>₹{transaction.net_payout_inr}</td></tr>
      </table>
      <span className="status">{transaction.settlement_status}</span>
    </div>
  )}
  ```

## 2. QA & Test Cases

### Test Environment
- Backend and Frontend servers running.
- User logged in with at least one invoice in "draft" status.

### Backend API Test Cases

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| **TC-WH-API-01** | Webhook - Valid Payment | `POST /webhooks/payment-received` with valid `reference` (payment_link_id). | HTTP `200 OK`. Response contains `transaction_id`, `net_payout_inr`, `fx_rate`. |
| **TC-WH-API-02** | Webhook - Invoice Not Found | `POST /webhooks/payment-received` with invalid `reference`. | HTTP `404 Not Found`. Error message: "Invoice not found for reference". |
| **TC-WH-API-03** | Webhook - Duplicate Payment | Call TC-WH-API-01 twice with same `reference`. | Second call: HTTP `200 OK` with message "Invoice already paid". No duplicate transaction created. |
| **TC-WH-API-04** | Transaction Created | Query `GET /transactions/` after TC-WH-API-01. | New transaction exists with all FX fields populated. |
| **TC-WH-API-05** | Invoice Status Updated | Query `GET /invoices/{id}` after TC-WH-API-01. | Invoice `status` is now "paid". |
| **TC-WH-API-06** | Mock Trigger Uses Webhook | `POST /mock/payments/trigger-payment`. | Same result as TC-WH-API-01 (internally calls webhook handler). |

### Frontend End-to-End Test Cases

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| **TC-WH-E2E-01** | Simulate Payment with Sender Name | 1. Go to payment page. <br> 2. Enter sender name. <br> 3. Click "Simulate Payment". | Payment succeeds. Sender name appears in transaction. |
| **TC-WH-E2E-02** | View FX Breakdown | 1. Complete a payment. <br> 2. Go to invoice detail page. | FX breakdown table is visible with Principal, Fee, Rate, GST, Net Settlement. |
| **TC-WH-E2E-03** | Verify Settlement Status | Check the transaction in the UI. | `settlement_status` shows "PENDING" (or "SETTLED" if settlement service runs). |
| **TC-WH-E2E-04** | Verify FIRA Contains FX Rate | 1. Download FIRA for a paid invoice. | PDF contains the locked FX rate from the transaction. |
