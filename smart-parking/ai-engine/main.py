from fastapi import FastAPI, UploadFile, File, HTTPException
import cv2
import numpy as np

from services.plate_pipeline import process_plate


app = FastAPI(
    title="Smart Parking AI Engine",
    description="AI Engine for License Plate Recognition",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "service": "Smart Parking AI Engine",
        "message": "License Plate Recognition API is running"
    }


@app.get("/api/ai/status")
def ai_status():
    return {
        "service": "Smart Parking AI Engine",
        "status": "running"
    }


@app.post("/api/ai/plate-recognition")
async def plate_recognition(file: UploadFile = File(...)):
    # Check that a file was uploaded
    if not file:
        raise HTTPException(
            status_code=400,
            detail="No image file provided"
        )

    # Read uploaded image
    image_bytes = await file.read()

    # Convert bytes to NumPy array
    image_array = np.frombuffer(image_bytes, np.uint8)

    # Decode image using OpenCV
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to read the uploaded image"
        )

    # Run complete license plate recognition pipeline
    result = process_plate(image)

    # No plate detected
    if result["plate_number"] is None:
        return {
            "success": False,
            "message": "No license plate detected",
            "plate_number": None,
            "confidence": 0,
            "bbox": None
        }

    # Successful recognition
    return {
        "success": True,
        "message": "License plate recognized successfully",
        "plate_number": result["plate_number"],
        "confidence": result["confidence"],
        "bbox": result["bbox"]
    }
