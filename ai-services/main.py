import base64
import requests
from fastapi import FastAPI
from pydantic import BaseModel
from rembg import remove

app = FastAPI(title="AI Image Studio - Python AI Service")

class ImageUrlRequest(BaseModel):
    imageUrl: str = None
    imageBase64: str = None

def get_image_bytes(payload) -> bytes:
    if payload.imageBase64:
        import base64 as b64
        data = payload.imageBase64
        if "," in data:
            data = data.split(",")[1]
        return b64.b64decode(data)
    if payload.imageUrl:
        response = requests.get(payload.imageUrl, timeout=30)
        if response.status_code != 200:
            raise Exception("Unable to download source image.")
        return response.content
    raise Exception("Either imageUrl or imageBase64 is required.")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/process/bg-remove")
def process_bg_remove(payload: ImageUrlRequest):
    try:
        input_bytes = get_image_bytes(payload)
        output_bytes = remove(input_bytes)
        return {"success": True, "imageBase64": base64.b64encode(output_bytes).decode(), "mimeType": "image/png"}
    except Exception as exc:
        return {"success": False, "message": str(exc)}

@app.post("/process/upscale")
def process_upscale(payload: ImageUrlRequest):
    try:
        import cv2
        import numpy as np
        from realesrgan import RealESRGANer
        from basicsr.archs.rrdbnet_arch import RRDBNet

        input_bytes = get_image_bytes(payload)
        nparr = np.frombuffer(input_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
        upsampler = RealESRGANer(scale=4, model_path='https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth', model=model, tile=128, tile_pad=10, pre_pad=0, half=False)

        output, _ = upsampler.enhance(img, outscale=4)
        _, buffer = cv2.imencode('.png', output)
        return {"success": True, "imageBase64": base64.b64encode(buffer).decode(), "mimeType": "image/png"}
    except Exception as exc:
        return {"success": False, "message": str(exc)}

@app.post("/process/face-restore")
def process_face_restore(payload: ImageUrlRequest):
    try:
        import cv2
        import numpy as np
        from gfpgan import GFPGANer

        input_bytes = get_image_bytes(payload)
        nparr = np.frombuffer(input_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        restorer = GFPGANer(model_path='https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.3.pth', upscale=2, arch='clean', channel_multiplier=2)
        _, _, output = restorer.enhance(img, has_aligned=False, only_center_face=False, paste_back=True)

        _, buffer = cv2.imencode('.png', output)
        return {"success": True, "imageBase64": base64.b64encode(buffer).decode(), "mimeType": "image/png"}
    except Exception as exc:
        return {"success": False, "message": str(exc)}

@app.post("/process/old-photo-repair")
def process_old_photo_repair(payload: ImageUrlRequest):
    return process_face_restore(payload)
