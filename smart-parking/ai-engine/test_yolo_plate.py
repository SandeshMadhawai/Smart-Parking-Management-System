from ultralytics import YOLO

# This time we load OUR plate-specific model instead of the generic one.
model = YOLO("license_plate_detector.pt")

# Run detection on the same test image as before.
results = model("uploads/test-car.jpg")

# Check what it found.
boxes = results[0].boxes
print(f"✅ Plate detector ran successfully!")
print(f"   Detected {len(boxes)} license plate(s) in the image")

# If it found something, print the confidence score and location for each detection.
for i, box in enumerate(boxes):
    confidence = box.conf[0].item()
    x1, y1, x2, y2 = box.xyxy[0].tolist()
    print(f"   Plate {i+1}: confidence={confidence:.2f}, location=({x1:.0f},{y1:.0f}) to ({x2:.0f},{y2:.0f})")

# Save a copy of the image with the detected box drawn on it, so we can visually confirm.
results[0].save(filename="uploads/test-car-detected.jpg")
print("   Saved annotated image to uploads/test-car-detected.jpg")