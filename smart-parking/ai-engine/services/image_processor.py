import cv2

def read_image(image_path: str):
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError("Unable to read image")

    return image

def resize_image(image, width=640):
    height, original_width = image.shape[:2]

    ratio = width / original_width
    new_height = int(height * ratio)

    resized = cv2.resize(image, (width, new_height))

    return resized

def enhance_image(image):
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)

    l_channel, a_channel, b_channel = cv2.split(lab)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced_l = clahe.apply(l_channel)

    enhanced_lab = cv2.merge((enhanced_l, a_channel, b_channel))

    enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    return enhanced

def crop_plate(image, bbox):
    x1, y1, x2, y2 = bbox

    plate = image[y1:y2, x1:x2]

    if plate.size == 0:
        raise ValueError("Invalid plate bounding box")

    return plate
