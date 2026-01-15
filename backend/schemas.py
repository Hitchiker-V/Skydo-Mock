from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    is_payment_onboarded: bool
    business_name: Optional[str] = None
    gstin: Optional[str] = None
    business_address: Optional[str] = None

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    business_name: str
    gstin: str
    business_address: str


# --- Virtual Account Schemas ---
class VirtualAccountBase(BaseModel):
    currency: str
    bank_name: str
    account_number: str
    routing_code: str
    provider: str

class VirtualAccountCreate(VirtualAccountBase):
    pass

class VirtualAccount(VirtualAccountBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

class ClientBase(BaseModel):
    name: str
    email: str
    address: Optional[str] = None

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

class InvoiceItemBase(BaseModel):
    description: str
    quantity: int
    unit_price: float

class InvoiceItemCreate(InvoiceItemBase):
    pass

class InvoiceItem(InvoiceItemBase):
    id: int
    invoice_id: int

    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    due_date: date
    client_id: int
    currency: str = "USD"

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]

# --- Transaction Schemas (Updated for V1 FX) ---
class TransactionBase(BaseModel):
    amount: float
    status: str

class TransactionCreate(TransactionBase):
    invoice_id: int

class Transaction(TransactionBase):
    id: int
    processed_at: datetime
    settlement_status: Optional[str] = None
    
    class Config:
        from_attributes = True

class TransactionDetail(BaseModel):
    """Extended transaction schema with full FX breakdown."""
    id: int
    invoice_id: int
    processed_at: datetime
    
    # Payment info
    sender_name: Optional[str] = None
    principal_amount: Optional[Decimal] = None
    currency: Optional[str] = None
    
    # FX info
    fx_rate: Optional[Decimal] = None
    flat_fee_usd: Optional[Decimal] = None
    gst_on_fee_inr: Optional[Decimal] = None
    
    # Settlement
    amount: float
    net_payout_inr: Optional[Decimal] = None
    status: str
    settlement_status: Optional[str] = None

    class Config:
        from_attributes = True

class Invoice(InvoiceBase):
    id: int
    status: str
    total_amount: float
    owner_id: int
    payment_link_id: Optional[str] = None
    items: List[InvoiceItem] = []
    client: Client

    class Config:
        from_attributes = True

