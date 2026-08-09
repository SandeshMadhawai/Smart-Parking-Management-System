from paddleocr import PaddleOCR

ocr = PaddleOCR(
    lang="en",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False,
    use_textline_orientation=False,
    enable_mkldnn=False
)

def recognize_plate(plate_image):
    """
    Recognize text from a cropped license plate image.
    Returns:
        str: Detected license plate text.
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
    return plate_text
