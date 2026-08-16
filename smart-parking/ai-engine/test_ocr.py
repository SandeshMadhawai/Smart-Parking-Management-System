import cv2
from ultralytics import YOLO
from paddleocr import PaddleOCR

# Step 1: Load our plate detector (same as before).
plate_model = YOLO("license_plate_detector.pt")

# Step 2: Load PaddleOCR.
# use_angle_cls helps it handle slightly tilted text.
# lang='en' since plates use English/Latin characters.
ocr = PaddleOCR(use_textline_orientation=True, lang='en', enable_mkldnn=False)

# Step 3: Load the test image using OpenCV (same as our earlier test).
image = cv2.imread("uploads/test-car.jpg")

# Step 4: Run YOLO to find the plate's location.
results = plate_model(image)
boxes = results[0].boxes

if len(boxes) == 0:
    print("❌ No plate detected, nothing to read.")
else:
    # Step 5: Get the coordinates of the best (most confident) detection.
    best_box = max(boxes, key=lambda b: b.conf[0].item())
    x1, y1, x2, y2 = map(int, best_box.xyxy[0].tolist())

    # Step 6: CROP — this is the new part.
    # We slice the image array using the coordinates, keeping ONLY the plate region.
    # Think of this like cutting out a small rectangle from a bigger photo.
    cropped_plate = image[y1:y2, x1:x2]

    # Save the cropped image so we can visually check it looks right.
    cv2.imwrite("uploads/cropped-plate.jpg", cropped_plate)
    print("✅ Cropped plate saved to uploads/cropped-plate.jpg")

    # Step 7: Run PaddleOCR on ONLY the cropped plate image, not the full photo.
    # Using .predict() instead of the older .ocr() method.
    ocr_result = ocr.predict(cropped_plate)

    # Step 8: Extract and print the actual text it read.
    # The new PaddleOCR version returns results as objects with named fields,
    # instead of the old nested-list format.
    print("\n📋 OCR Results:")
    if ocr_result and len(ocr_result) > 0:
        result = ocr_result[0]
        texts = result.get("rec_texts", [])
        scores = result.get("rec_scores", [])

        if texts:
            for text, score in zip(texts, scores):
                print(f"   Text: '{text}'  (confidence: {score:.2f})")
        else:
            print("   No text detected on the plate.")
    else:
        print("   No text detected on the plate.")