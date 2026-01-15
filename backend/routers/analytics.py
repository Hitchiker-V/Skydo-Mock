from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import database
from . import auth
from services import analytics
import models

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
    dependencies=[Depends(auth.get_current_user)],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/dashboard")
def get_dashboard_data(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    kpis = analytics.get_kpis(db, current_user.id)
    monthly_revenue = analytics.get_monthly_revenue(db, current_user.id)
    client_revenue = analytics.get_client_revenue(db, current_user.id)
    
    return {
        "kpis": kpis,
        "monthly_revenue": monthly_revenue,
        "client_revenue": client_revenue
    }
