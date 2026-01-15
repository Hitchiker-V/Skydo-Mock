from sqlalchemy import Boolean, Column, Integer, String, Text, ForeignKey, Date, Numeric, DateTime
from sqlalchemy.orm import relationship
import database
import datetime

class User(database.Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_payment_onboarded = Column(Boolean, default=False, nullable=False)
    
    # Business Profile (for GST compliance)
    business_name = Column(String, nullable=True)
    gstin = Column(String, nullable=True)
    business_address = Column(Text, nullable=True)


    clients = relationship("Client", back_populates="owner")
    invoices = relationship("Invoice", back_populates="owner")
    virtual_accounts = relationship("VirtualAccount", back_populates="owner")

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

class Client(database.Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, index=True)
    address = Column(Text)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="clients")
    invoices = relationship("Invoice", back_populates="client")

class Invoice(database.Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="draft")
    due_date = Column(Date)
    currency = Column(String(3), default="USD") # e.g., "USD", "EUR", "GBP"
    total_amount = Column(Numeric)
    client_id = Column(Integer, ForeignKey("clients.id"))
    owner_id = Column(Integer, ForeignKey("users.id"))
    payment_link_id = Column(String, unique=True, index=True, nullable=True)


    owner = relationship("User", back_populates="invoices")
    client = relationship("Client", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice")

class InvoiceItem(database.Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String)
    quantity = Column(Integer)
    unit_price = Column(Numeric)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))

    invoice = relationship("Invoice", back_populates="items")

class Transaction(database.Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Original payment info
    sender_name = Column(String, nullable=True)
    principal_amount = Column(Numeric(10, 2), nullable=True)  # Original foreign currency amount
    currency = Column(String(3), nullable=True)  # e.g., "USD", "EUR"
    
    # FX Engine fields (Treasury Lock)
    fx_rate = Column(Numeric(10, 4), nullable=True)  # Locked mid-market rate
    flat_fee_usd = Column(Numeric(10, 2), nullable=True)
    gst_on_fee_inr = Column(Numeric(10, 2), nullable=True)
    
    # Settlement fields
    amount = Column(Numeric(10, 2), nullable=False)  # Legacy: now stores net_payout_inr
    net_payout_inr = Column(Numeric(12, 2), nullable=True)  # Final settlement amount
    status = Column(String, nullable=False)  # e.g., 'succeeded', 'failed'
    settlement_status = Column(String, default="PENDING")  # PENDING, PROCESSING, SETTLED

    invoice = relationship("Invoice")

