from services.image_processor import (
    resize_image,
    enhance_image,
    crop_plate
)
from services.plate_detector import detect_plates
from services.ocr_service import recognize_plate


def process_plate(image):
    """
    Complete license plate recognition pipeline.

    Steps:
    1. Resize image
    2. Enhance image
    3. Detect license plate
    4. Crop detected plate
    5. Recognize plate text

    Returns:
        dict containing plate number, confidence and bounding box
    """

    # Step 1: Resize
    resized_image = resize_image(image)

    # Step 2: Enhance
    enhanced_image = enhance_image(resized_image)

    # Step 3: Detect plates
    detections = detect_plates(enhanced_image)

    if not detections:
        return {
            "plate_number": None,
            "confidence": 0,
            "bbox": None
        }

    # Take the first detected plate
    detection = detections[0]

    bbox = detection["bbox"]
    confidence = detection["confidence"]

    # Step 4: Crop plate
    plate_crop = crop_plate(enhanced_image, bbox)

    # Step 5: OCR
    plate_text = recognize_plate(plate_crop)

    return {
        "plate_number": plate_text,
        "confidence": confidence,
        "bbox": bbox
    }
