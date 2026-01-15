from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

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

    class Config:
        orm_mode = True

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
        orm_mode = True

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
        orm_mode = True

class InvoiceBase(BaseModel):
    due_date: date
    client_id: int

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]

class TransactionBase(BaseModel):
    amount: float
    status: str

class TransactionCreate(TransactionBase):
    invoice_id: int

class Transaction(TransactionBase):
    id: int
    processed_at: datetime
    
    class Config:
        orm_mode = True

class Invoice(InvoiceBase):
    id: int
    status: str
    total_amount: float
    owner_id: int
    payment_link_id: Optional[str] = None
    items: List[InvoiceItem] = []
    client: Client

    class Config:
        orm_mode = True
