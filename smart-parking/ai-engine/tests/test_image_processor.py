from services.image_processor import read_image
from services.plate_pipeline import process_plate


image_path = "tests/images/test_car.jpeg"

image = read_image(image_path)

print("Original image shape:", image.shape)

result = process_plate(image)

print("Plate recognition result:", result)