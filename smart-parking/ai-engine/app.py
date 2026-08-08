from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
import numpy as np
import cv2

app = FastAPI()

# Load the plate detection model ONCE when the server starts —
# not on every single request, since loading the model is slow.
# This is similar to how you'd connect to MongoDB once when server.js starts,
# not on every API call.
plate_model = YOLO("license_plate_detector.pt")

@app.get("/health")
def health_check():
    return {"success": True, "message": "AI Engine is running"}


@app.post("/detect-plate")
async def detect_plate(image: UploadFile = File(...)):
    # Step 1: Read the raw bytes of the uploaded image.
    # This is like reading req.file.buffer in your Node.js ocrController.js.
    image_bytes = await image.read()

    # Step 2: Convert those raw bytes into a format OpenCV can understand.
    # np.frombuffer turns the bytes into a numpy array,
    # cv2.imdecode then turns that array into an actual image OpenCV can process.
    np_array = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    # Safety check — if the uploaded file wasn't a valid image, don't crash.
    if frame is None:
        return {"success": False, "message": "Invalid image file"}

    # Step 3: Run our plate detection model on this image.
    results = plate_model(frame)
    boxes = results[0].boxes

    # Step 4: If no plate was found, tell the caller clearly.
    if len(boxes) == 0:
        return {"success": False, "message": "No license plate detected"}

    # Step 5: Take the detection with the highest confidence
    # (in case multiple things were detected, we trust the most confident one).
    best_box = max(boxes, key=lambda b: b.conf[0].item())
    confidence = best_box.conf[0].item()
    x1, y1, x2, y2 = best_box.xyxy[0].tolist()

    # Step 6: Return the result as JSON — same shape of response
    # your Node.js backend already expects from Plate Recognizer's API,
    # so swapping providers later will be easy.
    return {
        "success": True,
        "confidence": round(confidence, 2),
        "box": {
            "x1": round(x1), "y1": round(y1),
            "x2": round(x2), "y2": round(y2)
        }
    }