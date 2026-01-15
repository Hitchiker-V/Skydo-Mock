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

    clients = relationship("Client", back_populates="owner")
    invoices = relationship("Invoice", back_populates="owner")

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
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String, nullable=False) # e.g., 'succeeded', 'failed'
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)

    invoice = relationship("Invoice")
