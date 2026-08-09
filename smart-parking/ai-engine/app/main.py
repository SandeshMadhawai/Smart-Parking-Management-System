from fastapi import FastAPI

app = FastAPI(
    title="Smart Parking AI Engine",
    version="1.0.0"
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Engine"
    }