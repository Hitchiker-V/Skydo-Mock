from sqlalchemy.orm import Session
import models
import schemas
import security

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_clients(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Client).filter(models.Client.owner_id == user_id).offset(skip).limit(limit).all()

def create_client(db: Session, client: schemas.ClientCreate, user_id: int):
    db_client = models.Client(**client.dict(), owner_id=user_id)
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

def get_client(db: Session, client_id: int, user_id: int):
    return db.query(models.Client).filter(models.Client.id == client_id, models.Client.owner_id == user_id).first()

def update_client(db: Session, client_id: int, client: schemas.ClientCreate, user_id: int):
    db_client = get_client(db, client_id, user_id)
    if db_client:
        for key, value in client.dict().items():
            setattr(db_client, key, value)
        db.commit()
        db.refresh(db_client)
    return db_client

def delete_client(db: Session, client_id: int, user_id: int):
    db_client = get_client(db, client_id, user_id)
    if db_client:
        db.delete(db_client)
        db.commit()
    return db_client

def get_invoices(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Invoice).filter(models.Invoice.owner_id == user_id).offset(skip).limit(limit).all()

import secrets

# ...

def create_invoice(db: Session, invoice: schemas.InvoiceCreate, user_id: int):
    total_amount = sum(item.quantity * item.unit_price for item in invoice.items)
    payment_link_id = secrets.token_urlsafe(16)
    
    db_invoice = models.Invoice(
        due_date=invoice.due_date,
        client_id=invoice.client_id,
        owner_id=user_id,
        total_amount=total_amount,
        payment_link_id=payment_link_id
    )
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)

    for item in invoice.items:
        db_item = models.InvoiceItem(**item.dict(), invoice_id=db_invoice.id)
        db.add(db_item)
    
    db.commit()
    db.refresh(db_invoice)
    return db_invoice

def get_invoice(db: Session, invoice_id: int, user_id: int):
    return db.query(models.Invoice).filter(models.Invoice.id == invoice_id, models.Invoice.owner_id == user_id).first()

def set_user_onboarding_status(db: Session, user_id: int, status: bool):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.is_payment_onboarded = status
        db.commit()
        db.refresh(db_user)
    return db_user

def create_transaction(db: Session, transaction: schemas.TransactionCreate):
    db_transaction = models.Transaction(**transaction.dict())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_invoice_by_link_id(db: Session, payment_link_id: str):
    return db.query(models.Invoice).filter(models.Invoice.payment_link_id == payment_link_id).first()
