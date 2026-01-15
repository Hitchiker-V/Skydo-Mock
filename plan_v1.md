# V1 Implementation Plan: "Local-In, Local-Out" Architecture

## 1. Overview

This document details the plan to upgrade the Skydo Replica from V0 (Mock Payment Simulation) to V1 (Realistic "Local-In, Local-Out" Treasury Infrastructure). The goal is to model Skydo's core value proposition: **"Information moves globally, but value settles locally."**

V0 used a simple "Simulate Payment" button that directly marked an invoice as paid. V1 will introduce:

1.  **Virtual Accounts (VAs):** Localized bank details assigned to users for receiving foreign payments.
2.  **Treasury & FX Engine:** A service that locks the exchange rate the moment funds are detected and calculates the net INR payout.
3.  **Webhook-Driven Collection:** An asynchronous flow where a simulated "bank" calls our backend, mimicking real-world ACH/SEPA credit notifications.
4.  **Reconciliation & Settlement:** Logic to match incoming payments to invoices and record the final settlement.

---

## 2. Core Concepts from `plumbing.md`

| Concept | V1 Implementation |
| :--- | :--- |
| **Collection Layer (VAs)** | A `VirtualAccount` model linked to a `User`. The UI will display this to the user. |
| **Treasury Lock** | The `FxEngine` service will be called when a payment is received via webhook. It "locks" a rate and calculates the payout. |
| **Flat-Fee Deduction** | A configurable `FLAT_FEE_USD` (e.g., $29) is deducted from the principal before conversion. |
| **Payout Formula** | `Net_INR = (Principal_USD - Flat_Fee_USD) * Mid_Market_Rate`. Then `Payout = Net_INR - GST`. |
| **Settlement Layer** | A mock `SettlementService` that simulates the NEFT/IMPS payout to the merchant. |
| **FIRA Generation** | The existing PDF generator will be updated to use the new FX deal data. |

---

## 3. Detailed Changes

### Phase 1: Database Schema Updates

**File:** `backend/models.py`

#### 3.1.1. New Model: `VirtualAccount`

This model represents a user's virtual bank account in a specific currency corridor.

```python
class VirtualAccount(database.Base):
    __tablename__ = "virtual_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    currency = Column(String(3), nullable=False)  # e.g., "USD", "EUR"
    bank_name = Column(String, nullable=False)
    account_number = Column(String, nullable=False)
    routing_code = Column(String, nullable=False)  # ACH Routing, IBAN, etc.
    provider = Column(String, nullable=False)  # e.g., "Currencycloud", "Banking Circle"

    owner = relationship("User", back_populates="virtual_accounts")
```

A relationship `virtual_accounts = relationship("VirtualAccount", back_populates="owner")` must be added to the `User` model.

#### 3.1.2. Updated Model: `Transaction`

The `Transaction` model needs new fields to capture the FX deal.

| New Column | Type | Description |
| :--- | :--- | :--- |
| `sender_name` | `String` | Name of the payer (for reconciliation) |
| `principal_amount` | `Numeric` | Original amount in foreign currency (e.g., USD) |
| `currency` | `String(3)` | Currency of the payment |
| `fx_rate` | `Numeric` | The locked mid-market rate |
| `flat_fee_usd` | `Numeric` | The flat fee deducted |
| `gst_on_fee_inr` | `Numeric` | 18% GST on the flat fee in INR |
| `net_payout_inr` | `Numeric` | Final amount settled to the merchant |
| `settlement_status` | `String` | "PENDING", "PROCESSING", "SETTLED" |

---

### Phase 2: Treasury & FX Engine

**New File:** `backend/services/fx_engine.py`

This service is the heart of the V1 upgrade.

```python
# backend/services/fx_engine.py

from decimal import Decimal, ROUND_HALF_UP
import random

# --- Configuration ---
FLAT_FEE_USD = Decimal("29.00")
GST_RATE = Decimal("0.18")  # 18%

# Mock mid-market rates (in a real system, this would be an API call)
MOCK_RATES = {
    "USD_INR": Decimal("83.50"),
    "EUR_INR": Decimal("90.25"),
    "GBP_INR": Decimal("105.80"),
}

def get_mid_market_rate(currency_pair: str) -> Decimal:
    """Fetches the live mid-market rate. Mocked for V1."""
    base_rate = MOCK_RATES.get(currency_pair, Decimal("1.0"))
    # Simulate minor fluctuation
    fluctuation = Decimal(random.uniform(-0.05, 0.05)).quantize(Decimal("0.01"))
    return base_rate + fluctuation

def calculate_payout(principal_usd: Decimal, currency: str = "USD") -> dict:
    """
    Calculates the final INR payout amount.
    Formula: Payout = (Principal - FlatFee) * Rate - GST
    """
    currency_pair = f"{currency}_INR"
    fx_rate = get_mid_market_rate(currency_pair)

    net_usd = principal_usd - FLAT_FEE_USD
    gross_inr = (net_usd * fx_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    # GST is calculated on the flat fee, converted to INR
    flat_fee_inr = (FLAT_FEE_USD * fx_rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    gst_on_fee_inr = (flat_fee_inr * GST_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    net_payout_inr = (gross_inr - gst_on_fee_inr).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return {
        "principal_usd": principal_usd,
        "flat_fee_usd": FLAT_FEE_USD,
        "fx_rate": fx_rate,
        "gross_inr": gross_inr,
        "gst_on_fee_inr": gst_on_fee_inr,
        "net_payout_inr": net_payout_inr,
    }
```

---

### Phase 3: Webhook-Driven Collection Layer

**New File:** `backend/routers/webhooks.py`

This endpoint simulates the callback from a Banking-as-a-Service provider (e.g., Currencycloud).

```python
# backend/routers/webhooks.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from decimal import Decimal
import database
import crud
import models
from services import fx_engine

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

class PaymentReceivedPayload(BaseModel):
    # This mimics what a real bank webhook would send
    sender_name: str
    amount: Decimal
    currency: str  # e.g., "USD"
    reference: str  # This is typically the Invoice ID or Payment Link ID

@router.post("/payment-received", status_code=status.HTTP_200_OK)
def handle_payment_received(
    payload: PaymentReceivedPayload,
    db: Session = Depends(database.get_db)
):
    """
    Simulates receiving a webhook from a BaaS provider when funds hit a VA.
    """
    # 1. Find the Invoice based on the reference (payment_link_id)
    invoice = db.query(models.Invoice).filter(
        models.Invoice.payment_link_id == payload.reference
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found for reference.")

    if invoice.status == "paid":
        return {"message": "Invoice already paid. Ignoring duplicate webhook."}

    # 2. Treasury Lock: Calculate the FX and Payout
    payout_details = fx_engine.calculate_payout(payload.amount, payload.currency)

    # 3. Create a Transaction record
    new_transaction = models.Transaction(
        invoice_id=invoice.id,
        sender_name=payload.sender_name,
        principal_amount=payout_details["principal_usd"],
        currency=payload.currency,
        amount=payout_details["net_payout_inr"],  # The 'amount' field now stores the final INR payout
        fx_rate=payout_details["fx_rate"],
        flat_fee_usd=payout_details["flat_fee_usd"],
        gst_on_fee_inr=payout_details["gst_on_fee_inr"],
        net_payout_inr=payout_details["net_payout_inr"],
        status="succeeded",
        settlement_status="PENDING", # Will be marked SETTLED by SettlementService
    )
    db.add(new_transaction)

    # 4. Update Invoice status
    invoice.status = "paid"
    db.commit()

    return {"message": "Payment processed successfully.", "transaction_id": new_transaction.id}
```

This router must be registered in `main.py`.

---

### Phase 4: Update Mock Payment Trigger

**File:** `backend/routers/mock_payments.py`

The existing `/mock/payments/trigger-payment` endpoint will be updated. Instead of directly modifying the database, it will now make an internal call to the new webhook handler, simulating the entire async flow.

```python
# The trigger endpoint now simulates a bank calling our webhook
import httpx # Or use requests

@router.post("/trigger-payment")
async def trigger_mock_payment(payload: MockPaymentPayload, db: Session = Depends(database.get_db)):
    # ... find invoice ...
    
    # Construct the payload as if from a bank
    webhook_payload = {
        "sender_name": payload.sender_name or "Mock Payer Inc.",
        "amount": str(invoice.total_amount),
        "currency": "USD",
        "reference": invoice.payment_link_id
    }
    
    # Internally call the webhook handler
    # Note: For a cleaner approach, refactor the core logic into a shared service
    # and call it from both endpoints. For V1, a direct call is acceptable.
    # ... call handle_payment_received logic ...
    
    return {"message": "Mock payment triggered successfully."}
```

---

### Phase 5: Frontend Updates

**5.1. Display Virtual Accounts**

*   **File:** `frontend/src/app/dashboard/page.tsx`
*   On load, fetch the user's virtual accounts from a new API endpoint (`GET /users/me/virtual-accounts`).
*   Display them in a card: "Receive USD Payments: Bank: CFSB, Account: ..., Routing: ..."

**5.2. Update Invoice Detail Page**

*   **File:** `frontend/src/app/invoices/[id]/page.tsx`
*   After a payment is made, display a detailed breakdown:
    *   Principal Received: $X,XXX.XX
    *   Flat Fee: -$29.00
    *   FX Rate: 83.50 INR/USD
    *   GST (18% on fee): -₹XXX.XX
    *   **Net Settlement: ₹X,XX,XXX.XX**

**5.3. Update Payment Simulation**

*   **File:** `frontend/src/app/pay/[paymentLinkId]/page.tsx`
*   The "Simulate Successful Payment" button will now call the `/mock/payments/trigger-payment` endpoint with a `sender_name` field (can be hardcoded for V1).

---

## 4. Verification Plan

| KPI from `plumbing.md` | V1 Verification Method |
| :--- | :--- |
| **Detection Latency** | Simulated. The webhook response is near-instant. A future V2 could add artificial delay. |
| **FX Slippage** | Unit test the `calculate_payout` function to ensure the math is correct (Target: < 0.01%). |
| **Reconciliation Rate** | Integration test: trigger 10 payments, assert all 10 invoices are marked as "paid". |
| **FIRA Turnaround** | After a transaction, verify the FIRA PDF is immediately available and contains the correct FX rate. |

### End-to-End Test Script

1.  **User A** registers and is auto-assigned a Virtual Account.
2.  **User A** creates a Client and an Invoice for $1,000.
3.  **User A** (acting as the client) navigates to the payment link.
4.  **User A** clicks "Simulate Successful Payment".
5.  **System** receives webhook -> runs FX Engine -> creates Transaction -> updates Invoice.
6.  **User A** refreshes the invoice page and sees:
    *   Status: `Paid`
    *   Net Settlement: ~₹81,xxx (after fee and GST).
7.  **User A** downloads the FIRA, which shows the locked FX rate.

---

## 5. File Summary

| Action | File Path |
| :--- | :--- |
| MODIFY | `backend/models.py` |
| NEW | `backend/services/fx_engine.py` |
| NEW | `backend/routers/webhooks.py` |
| MODIFY | `backend/routers/mock_payments.py` |
| MODIFY | `backend/main.py` (register webhook router) |
| MODIFY | `backend/schemas.py` (new schemas for VA and Transaction) |
| MODIFY | `frontend/src/app/dashboard/page.tsx` |
| MODIFY | `frontend/src/app/invoices/[id]/page.tsx` |
| MODIFY | `frontend/src/app/pay/[paymentLinkId]/page.tsx` |
| MODIFY | `frontend/src/services/api.ts` (new API calls) |
