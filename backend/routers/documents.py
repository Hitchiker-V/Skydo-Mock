from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import database
from . import auth
from services import pdf_generator
import crud
import models

router = APIRouter(
    prefix="/documents",
    tags=["documents"],
    dependencies=[Depends(auth.get_current_user)],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/invoices/{invoice_id}/download")
def download_invoice(invoice_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    invoice = crud.get_invoice(db, invoice_id=invoice_id, user_id=current_user.id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    pdf_buffer = pdf_generator.generate_invoice_pdf(invoice)
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{invoice.id}.pdf"}
    )

@router.get("/invoices/{invoice_id}/fira")
def download_fira(invoice_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    invoice = crud.get_invoice(db, invoice_id=invoice_id, user_id=current_user.id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status != "paid":
        raise HTTPException(status_code=400, detail="FIRA is only available for paid invoices")
    
    # Fetch transaction details for FX breakdown
    transaction = db.query(models.Transaction).filter(
        models.Transaction.invoice_id == invoice.id
    ).first()
    
    pdf_buffer = pdf_generator.generate_fira_pdf(invoice, transaction)
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=fira_{invoice.id}.pdf"}
    )

