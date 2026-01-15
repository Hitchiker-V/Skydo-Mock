# Module Plan: End-to-End Mock Payment Flow

This document outlines the plan for the fourth module: implementing a full, end-to-end mock payment flow. This will connect the invoice creation process to a simulated payment and fulfillment action, testing the core business logic without external dependencies.

## 1. Development Plan

### 1.1. Backend Development (FastAPI)

- **Database Models (`models.py`):**
  - **Modify `Invoice` model:** Add a field to store a unique ID for the public payment link.
    ```python
    payment_link_id = Column(String, unique=True, index=True, nullable=True)
    ```
  - **Create new `Transaction` model:**
    ```python
    class Transaction(Base):
        __tablename__ = "transactions"
        id = Column(Integer, primary_key=True, index=True)
        amount = Column(Numeric(10, 2), nullable=False)
        status = Column(String, nullable=False) # e.g., 'succeeded', 'failed'
        invoice_id = Column(Integer, ForeignKey("invoices.id"))
        processed_at = Column(DateTime, default=datetime.datetime.utcnow)
        invoice = relationship("Invoice")
    ```

- **Internal Service Logic (`services/fulfillment.py`):**
  - Create this new file to house the core "webhook" logic.
  - Create a function `process_successful_payment(db: Session, invoice: models.Invoice)` that:
    1.  Updates the invoice `status` to 'paid'.
    2.  Creates a new `Transaction` record with the invoice's amount and a 'succeeded' status.
    3.  Commits the changes to the database session.

- **API Routers:**
  - **Modify `routers/invoices.py`:**
    - At the end of the `POST /invoices/` (create invoice) endpoint logic, generate a unique token (e.g., using Python's `secrets.token_urlsafe(16)`) and assign it to the invoice's `payment_link_id` before saving.
    - Create a new **public** endpoint `GET /invoices/public/{payment_link_id}`.
      - This endpoint does **not** require authentication.
      - It retrieves the invoice by `payment_link_id`. If not found, it returns a 404.
      - It returns a schema with only safe, public information (e.g., line items, total amount, but not owner details).

  - **Modify `routers/mock_payments.py`:**
    - Create a new endpoint `POST /mock/payments/trigger-payment`:
      - **Protection:** This endpoint should be public for the simulation.
      - **Accepts:** A Pydantic schema with `payment_link_id` and a `status` ('success' or 'failure').
      - **Logic:**
        - Finds the invoice by `payment_link_id`.
        - If `status` is 'success', it calls the `process_successful_payment` service function.
        - Returns a simple success message.

### 1.2. Frontend Development (Next.js)

- **API Services (`services/api.ts`):**
  - Add `getPublicInvoice(paymentLinkId)` to call `GET /invoices/public/{paymentLinkId}`.
  - Add `triggerMockPayment(paymentLinkId, status)` to call `POST /mock/payments/trigger-payment`.

- **New Public Payment Page:**
  - Create a new page at **`/pay/[paymentLinkId].tsx`**. This page is public and should not use the standard authenticated layout.
  - On page load (`useEffect`), it uses the `paymentLinkId` from the URL to call `getPublicInvoice` and displays the invoice details (amount, description).
  - The page will not have a real payment form. It will have two buttons:
    - **"Simulate Successful Payment"**: Calls `triggerMockPayment(paymentLinkId, 'success')`. On success, it should hide the buttons and show a "Payment Successful!" message.
    - **"Simulate Failed Payment"**: Calls `triggerMockPayment(paymentLinkId, 'failure')`.

- **Updates to Authenticated Invoice Views:**
  - **`/invoices/[id]` page:**
    - Display the generated mock payment link (e.g., `http://localhost:3000/pay/{invoice.payment_link_id}`).
    - Add a "Copy Link" button next to it for easy access.
  - **`/invoices` list page:**
    - The `status` column should now accurately reflect the updated status ('draft', 'paid', etc.). Data fetching might need to be refreshed (e.g., using `SWR` or `React Query`) to show changes after a payment is made.

## 2. QA & Test Cases

### Test Environment
- User is logged in, has created a client, and created an invoice for that client (status: 'draft').
- Backend and Frontend servers are running.

### Backend API Test Cases

| Test ID            | Description                              | Steps                                                                                                 | Expected Result                                                                                                     |
| ------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **TC-FLOW-API-01** | Invoice Creation Generates Link          | `POST /invoices/` to create a new invoice.                                                            | HTTP `200 OK`. The returned invoice object contains a non-null, unique `payment_link_id`.                            |
| **TC-FLOW-API-02** | Get Public Invoice Data (Success)        | `GET /invoices/public/{payment_link_id}` using the ID from the previous test.                           | HTTP `200 OK`. Response contains public invoice data.                                                               |
| **TC-FLOW-API-03** | Trigger Mock Payment (Success)           | `POST /mock/payments/trigger-payment` with body `{ "payment_link_id": "...", "status": "success" }`. | HTTP `200 OK`.                                                                                                      |
| **TC-FLOW-API-04** | Verify Database State After Success    | 1. Query the `invoices` table for the specific invoice. <br> 2. Query the `transactions` table.         | 1. The invoice's `status` is now 'paid'. <br> 2. A new transaction record exists for this invoice with `status: 'succeeded'`. |

### Frontend End-to-End Test Cases

| Test ID          | Description                        | Steps                                                                                                                                                                 | Expected Result                                                                                                                                       |
| ---------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TC-FLOW-E2E-01** | Copy Payment Link                  | 1. Log in and navigate to the detail page for a 'draft' invoice.                                                                                                    | A payment link (e.g., `http://localhost:3000/pay/...`) is displayed, and the "Copy Link" button works.                                            |
| **TC-FLOW-E2E-02** | View Public Payment Page           | 1. Open the copied link in a new browser tab (or incognito window).                                                                                                   | The public payment page loads, displaying the correct invoice amount and details. No authenticated user information is visible.                         |
| **TC-FLOW-E2E-03** | Simulate Payment                   | 1. On the public payment page, click the "Simulate Successful Payment" button.                                                                                        | The buttons disappear, and a "Payment Successful!" message is shown on the page.                                                                    |
| **TC-FLOW-E2E-04** | Verify Invoice Status in UI        | 1. Go back to the browser tab with the logged-in user. <br> 2. Navigate or refresh the `/invoices` list page.                                                            | The status of the invoice from the test is now displayed as "Paid".                                                                                   |
| **TC-FLOW-E2E-05** | Verify Details Page Update         | 1. From the `/invoices` list, click on the "Paid" invoice.                                                                                                            | The invoice detail page also shows the status as "Paid".                                                                                              |
