from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
from paddleocr import PaddleOCR
import numpy as np
import cv2

app = FastAPI()

# Load both models ONCE when the server starts — not on every request.
# Loading these is slow, so we do it a single time and reuse them for every image that comes in.
plate_model = YOLO("license_plate_detector.pt")
ocr = PaddleOCR(use_textline_orientation=True, lang='en', enable_mkldnn=False)


@app.get("/health")
def health_check():
    return {"success": True, "message": "AI Engine is running"}


@app.post("/detect-plate")
async def detect_plate(image: UploadFile = File(...)):
    # Step 1: Read the uploaded image into memory.
    image_bytes = await image.read()
    np_array = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if frame is None:
        return {"success": False, "message": "Invalid image file"}

    # Step 2: Run YOLO to find where the plate is.
    results = plate_model(frame)
    boxes = results[0].boxes

    if len(boxes) == 0:
        return {"success": False, "message": "No license plate detected"}

    # Step 3: Take the most confident detection.
    best_box = max(boxes, key=lambda b: b.conf[0].item())
    detection_confidence = best_box.conf[0].item()
    x1, y1, x2, y2 = map(int, best_box.xyxy[0].tolist())

    # Step 4: Crop out just the plate region.
    cropped_plate = frame[y1:y2, x1:x2]

    # Step 5: Run OCR on the cropped plate to read the actual text.
    ocr_result = ocr.predict(cropped_plate)

    if not ocr_result or len(ocr_result) == 0:
        return {
            "success": False,
            "message": "Plate detected but text could not be read",
            "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
        }

    result = ocr_result[0]
    texts = result.get("rec_texts", [])
    scores = result.get("rec_scores", [])

    if not texts:
        return {
            "success": False,
            "message": "Plate detected but no text found",
            "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
        }

    # Step 6: Combine all detected text pieces into one plate string
    # (in case OCR reads it as multiple separate text fragments),
    # and clean it up — remove spaces, uppercase it, matching the format
    # your existing Plate Recognizer integration already expects.
    plate_text = "".join(texts).upper().replace(" ", "")
    avg_confidence = sum(scores) / len(scores)

    # Step 7: Return in the SAME shape your Node.js backend already expects
    # from Plate Recognizer's API — this makes swapping providers later easy.
    return {
        "success": True,
        "plate": plate_text,
        "confidence": round(avg_confidence * 100),
        "detection_confidence": round(detection_confidence, 2),
        "box": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
    }