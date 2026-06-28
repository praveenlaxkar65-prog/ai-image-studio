import base64

import requests
from fastapi import FastAPI
from pydantic import BaseModel
from rembg import remove

app = FastAPI(title="AI Image Studio - Python AI Service")


class ImageUrlRequest(BaseModel):
    imageUrl: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/process/bg-remove")
def process_bg_remove(payload: ImageUrlRequest):
    try:
        response = requests.get(payload.imageUrl, timeout=30)
        if response.status_code != 200:
            return {"success": False, "message": "Unable to download source image."}

        input_bytes = response.content
        output_bytes = remove(input_bytes)  # rembg — returns PNG bytes with bg removed

        image_base64 = base64.b64encode(output_bytes).decode("utf-8")

        return {
            "success": True,
            "imageBase64": image_base64,
            "mimeType": "image/png",
        }
    except Exception as exc:
        return {"success": False, "message": str(exc)}
