from paddleocr import PaddleOCR
import re

ocr = PaddleOCR(
    lang="en",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    enable_mkldnn=False
)


def clean_plate_text(text):
    """
    Clean OCR output and extract a license plate-like value.
    """

    # Convert to uppercase
    text = text.upper()

    # Remove spaces and special characters
    text = re.sub(r"[^A-Z0-9]", "", text)
    
    # Find an Indian-style license plate pattern
    match = re.search(
        r"[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{3,4}",
        text
    )
    if match:
        return match.group(0)
    
    # If no valid pattern is found, return cleaned text
    return text

def recognize_plate(plate_image):
    """
    Recognize text from a cropped license plate image.
    Returns:
        str: Cleaned license plate text.
    """
    result = ocr.predict(plate_image)

    plate_text = ""
    for res in result:
        if hasattr(res, "json"):
            data = res.json
            if callable(data):
                data = data()
            if isinstance(data, dict):
                ocr_res = data.get("res", {})
                texts = ocr_res.get("rec_texts", [])
                if texts:
                    plate_text = " ".join(texts)

    # Clean OCR output
    plate_text = clean_plate_text(plate_text)
    return plate_text