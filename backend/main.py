from fastapi import FastAPI
import database
import models
import routers

# NOTE: This will drop and recreate all tables on each startup.
# This is useful for development to apply schema changes, but
# should be removed or disabled in a production environment.
database.Base.metadata.drop_all(bind=database.engine)
database.Base.metadata.create_all(bind=database.engine)

from fastapi.middleware.cors import CORSMiddleware
print("Starting FastAPI app with CORS enabled...")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

app.include_router(routers.auth.router)
app.include_router(routers.clients.router)
app.include_router(routers.invoices.router)
app.include_router(routers.mock_payments.router)
app.include_router(routers.public_invoices.router)
app.include_router(routers.analytics.router)
app.include_router(routers.documents.router)
app.include_router(routers.webhooks.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Skydo Replica API"}
