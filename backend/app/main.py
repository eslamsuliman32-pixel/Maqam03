from fastapi import FastAPI
from app.api.routes.align import router as align_router
from app.api.routes.health import router as health_router

app = FastAPI(title="MAQAM Align Engine Backend")

app.include_router(align_router)
app.include_router(health_router)

@app.get("/")
async def root():
    return {"message": "MAQAM Align Engine is active"}
