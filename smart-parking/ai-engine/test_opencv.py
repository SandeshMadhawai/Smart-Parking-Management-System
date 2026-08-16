import cv2

# This loads the image file into memory as pixel data.
# Think of this as the Python equivalent of reading a file with fs.readFileSync in Node.js,
# except OpenCV understands it's specifically an image and decodes it accordingly.
image = cv2.imread("uploads/test-car.jpg")

# If the image failed to load (wrong path, corrupted file), OpenCV returns "None" instead of crashing.
# This check ensures we catch that early instead of a confusing error later.
if image is None:
    print("❌ Failed to load image. Check the file path.")
else:
    # .shape gives us (height, width, color_channels) — basic proof the image loaded correctly.
    height, width, channels = image.shape
    print(f"✅ Image loaded successfully!")
    print(f"   Width: {width}px")
    print(f"   Height: {height}px")
    print(f"   Color channels: {channels}")