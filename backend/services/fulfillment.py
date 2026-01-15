from sqlalchemy.orm import Session
import models
import schemas
import crud

def process_successful_payment(db: Session, invoice: models.Invoice):
    # 1. Update invoice status
    invoice.status = "paid"
    db.commit()
    db.refresh(invoice)

    # 2. Create transaction record
    transaction_data = schemas.TransactionCreate(
        amount=invoice.total_amount,
        status="succeeded",
        invoice_id=invoice.id
    )
    crud.create_transaction(db, transaction_data)
    
    return invoice
