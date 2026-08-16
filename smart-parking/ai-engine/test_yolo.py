from ultralytics import YOLO

# This downloads a small, general-purpose pretrained YOLO model automatically
# the first time you run this (it's not trained specifically for license plates yet —
# that comes later. Right now we're just proving YOLO itself works).
model = YOLO("yolov8n.pt")

# Run detection on our test image.
results = model("uploads/test-car.jpg")

# Print out what YOLO found in the image (general objects, since this is the generic model).
print("✅ YOLO ran successfully!")
print(f"   Detected {len(results[0].boxes)} object(s) in the image")