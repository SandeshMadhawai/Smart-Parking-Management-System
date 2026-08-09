from open_image_models import create_detector

MODEL_NAME = "yolo-v9-t-640-license-plate-end2end"

detector = create_detector(
    MODEL_NAME,
    conf_thresh=0.5
)

def detect_plates(image):
    """
    Detect license plates in an image.

    Returns:
        list: Detected license plate information.
    """

    results = detector.predict(image)
    detections = []
    for result in results:
        box = result.bounding_box
        detections.append({
            "label": result.label,
            "bbox": [
                box.x1,
                box.y1,
                box.x2,
                box.y2
            ],
            "confidence": result.confidence
        })
    return detections