from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
from core.stock_search import load_stock_data
import threading

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load stock data in background to allow server to start responding to health checks immediately
    # But for search, it will still block if not ready.
    # We use a thread to not block the event loop.
    threading.Thread(target=load_stock_data).start()
    yield
    # Clean up if needed

app = FastAPI(title="RealK API", docs_url="/api/docs", openapi_url="/api/openapi.json", lifespan=lifespan)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now (dev mode)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "RealK API is running"}

@app.get("/")
def read_root():
    return {"message": "Welcome to RealK API. Visit /api/docs for documentation."}

from api.v1.endpoints import chart
app.include_router(chart.router, prefix="/api/v1", tags=["chart"])

