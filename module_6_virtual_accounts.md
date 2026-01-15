# Module Plan: Virtual Accounts & Database Schema Updates

This document outlines the plan for implementing Virtual Accounts and updating the database schema to support the V1 "Local-In, Local-Out" treasury architecture.

## 1. Development Plan

### 1.1. Backend Development (FastAPI)

- **Database Models (`models.py`):**

  - **Create new `VirtualAccount` model:**
    ```python
    class VirtualAccount(database.Base):
        __tablename__ = "virtual_accounts"

        id = Column(Integer, primary_key=True, index=True)
        user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
        currency = Column(String(3), nullable=False)  # e.g., "USD", "EUR", "GBP"
        bank_name = Column(String, nullable=False)
        account_number = Column(String, nullable=False)
        routing_code = Column(String, nullable=False)  # ACH Routing, IBAN, Sort Code
        provider = Column(String, nullable=False)  # e.g., "Currencycloud", "Banking Circle"

        owner = relationship("User", back_populates="virtual_accounts")
    ```

  - **Modify `User` model:** Add relationship.
    ```python
    virtual_accounts = relationship("VirtualAccount", back_populates="owner")
    ```

  - **Modify `Transaction` model:** Add FX and settlement fields.
    ```python
    sender_name = Column(String, nullable=True)
    principal_amount = Column(Numeric(10, 2), nullable=True)  # Original foreign currency amount
    currency = Column(String(3), nullable=True)  # e.g., "USD"
    fx_rate = Column(Numeric(10, 4), nullable=True)  # Locked mid-market rate
    flat_fee_usd = Column(Numeric(10, 2), nullable=True)
    gst_on_fee_inr = Column(Numeric(10, 2), nullable=True)
    net_payout_inr = Column(Numeric(12, 2), nullable=True)  # Final settlement amount
    settlement_status = Column(String, default="PENDING")  # PENDING, PROCESSING, SETTLED
    ```

- **Pydantic Schemas (`schemas.py`):**

  - **`VirtualAccountBase`** and **`VirtualAccount`**: For API responses.
    ```python
    class VirtualAccountBase(BaseModel):
        currency: str
        bank_name: str
        account_number: str
        routing_code: str
        provider: str

    class VirtualAccount(VirtualAccountBase):
        id: int
        user_id: int
        class Config:
            from_attributes = True
    ```

  - **`TransactionDetail`**: Extended schema with FX breakdown.
    ```python
    class TransactionDetail(BaseModel):
        id: int
        sender_name: Optional[str]
        principal_amount: Optional[Decimal]
        currency: Optional[str]
        fx_rate: Optional[Decimal]
        flat_fee_usd: Optional[Decimal]
        gst_on_fee_inr: Optional[Decimal]
        net_payout_inr: Optional[Decimal]
        settlement_status: str
        processed_at: datetime
        class Config:
            from_attributes = True
    ```

- **CRUD Operations (`crud.py`):**

  - `create_virtual_account(db, user_id, va_data)`: Creates a new VA for a user.
  - `get_virtual_accounts_by_user(db, user_id)`: Returns all VAs for a user.

- **API Endpoints (`routers/users.py` or new `routers/accounts.py`):**

  - `GET /users/me/virtual-accounts`: Returns the authenticated user's virtual accounts.

- **Auto-Provisioning on Registration:**

  - Modify the `POST /auth/register` endpoint or add a post-registration hook.
  - When a new user registers, automatically create a default USD Virtual Account:
    ```python
    # Example default VA data
    default_va = {
        "currency": "USD",
        "bank_name": "Community Federal Savings Bank",
        "account_number": f"VA{secrets.token_hex(6).upper()}",
        "routing_code": "026073150",
        "provider": "Currencycloud"
    }
    ```

### 1.2. Frontend Development (Next.js)

- **API Services (`services/api.ts`):**
  - Add `getMyVirtualAccounts()` to call `GET /users/me/virtual-accounts`.

- **Dashboard Updates (`app/dashboard/page.tsx`):**
  - Add a "Virtual Accounts" card that displays the user's VA details.
  - Display: Bank Name, Account Number, Routing Code, Currency.
  - Include a "Copy" button for the account number.

## 2. QA & Test Cases

### Test Environment
- Backend running on `http://localhost:5001`.
- Frontend running on `http://localhost:3000`.
- Database has been migrated with the new schema.

### Backend API Test Cases

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| **TC-VA-API-01** | Auto-Provisioning on Registration | `POST /auth/register` with new user credentials. | HTTP `200 OK`. User created successfully. |
| **TC-VA-API-02** | Verify VA Created | `GET /users/me/virtual-accounts` with the new user's token. | HTTP `200 OK`. Response contains 1 Virtual Account with currency "USD". |
| **TC-VA-API-03** | VA Fields Populated | Inspect the response from TC-VA-API-02. | `bank_name`, `account_number`, and `routing_code` are all non-null strings. |
| **TC-VA-API-04** | Transaction Schema Updated | Create an invoice, trigger a mock payment (from Module 2), then `GET /transactions/{id}`. | Response includes new fields: `fx_rate`, `flat_fee_usd`, `net_payout_inr`, `settlement_status`. |

### Frontend End-to-End Test Cases

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| **TC-VA-E2E-01** | Display Virtual Account on Dashboard | 1. Log in as a registered user. <br> 2. Navigate to `/dashboard`. | A "Virtual Accounts" card is visible, showing USD account details. |
| **TC-VA-E2E-02** | Copy Account Number | 1. On the dashboard, click "Copy" next to the account number. | The account number is copied to clipboard. A success toast/message appears. |
| **TC-VA-E2E-03** | New User Sees VA | 1. Register a new user. <br> 2. Log in and go to dashboard. | The new user immediately sees their provisioned Virtual Account. |
