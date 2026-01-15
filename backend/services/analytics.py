from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from datetime import datetime

def get_kpis(db: Session, user_id: int):
    # Total Revenue (Paid Invoices)
    total_revenue = db.query(func.sum(models.Invoice.total_amount))\
        .filter(models.Invoice.owner_id == user_id, models.Invoice.status == 'paid')\
        .scalar() or 0.0

    # Outstanding Amount (Draft/Sent Invoices)
    outstanding_amount = db.query(func.sum(models.Invoice.total_amount))\
        .filter(models.Invoice.owner_id == user_id, models.Invoice.status != 'paid')\
        .scalar() or 0.0

    # Total Invoices
    total_invoices = db.query(models.Invoice).filter(models.Invoice.owner_id == user_id).count()

    # Pending Settlements (PROCESSING status)
    pending_settlements_count = db.query(models.Transaction).join(models.Invoice)\
        .filter(models.Invoice.owner_id == user_id, models.Transaction.settlement_status == 'PROCESSING')\
        .count()

    return {
        "total_revenue": float(total_revenue),
        "outstanding_amount": float(outstanding_amount),
        "total_invoices": total_invoices,
        "pending_settlements_count": pending_settlements_count
    }


def get_monthly_revenue(db: Session, user_id: int):
    # Aggregate revenue by month using Transaction processed_at
    results = db.query(
            func.to_char(models.Transaction.processed_at, 'YYYY-MM').label('month'),
            func.sum(models.Transaction.amount).label('revenue')
        )\
        .join(models.Invoice)\
        .filter(models.Invoice.owner_id == user_id)\
        .group_by('month')\
        .order_by('month')\
        .all()
        
    return [{"month": r.month, "revenue": float(r.revenue)} for r in results]

def get_client_revenue(db: Session, user_id: int):
    results = db.query(
            models.Client.name,
            func.sum(models.Invoice.total_amount).label('revenue')
        )\
        .join(models.Invoice)\
        .filter(models.Invoice.owner_id == user_id, models.Invoice.status == 'paid')\
        .group_by(models.Client.name)\
        .all()
        
    return [{"name": r.name, "value": float(r.revenue)} for r in results]
