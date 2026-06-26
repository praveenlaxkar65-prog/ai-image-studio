const express = require('express');
const router = express.Router();

const { verifyToken } = require('../auth/authMiddleware');

// Basic
const { cropImage } = require('../tools/basic/cropController');
const { resizeImage } = require('../tools/basic/resizeController');
const { compressImage } = require('../tools/basic/compressController');

// Enhance
const { correctColor } = require('../tools/enhance/colorCorrectionController');
const { applyFilter } = require('../tools/enhance/filtersController');
const { sharpenImage } = require('../tools/enhance/sharpenController');
const { reduceNoise } = require('../tools/enhance/noiseReductionController');

// AI-Edit
const { removeBackground } = require('../tools/aiEdit/bgRemoveController');
const { inpaintImage } = require('../tools/aiEdit/inpaintController');
const { outpaintImage } = require('../tools/aiEdit/outpaintController');
const { upscaleImage } = require('../tools/aiEdit/upscaleController');
const { restoreFace } = require('../tools/aiEdit/faceRestoreController');
const { repairOldPhoto } = require('../tools/aiEdit/oldPhotoRepairController');

// Generate
const { generateImage } = require('../tools/generate/textToImageController');
const { generateCharacter } = require('../tools/generate/characterGenController');
const { controlCharacter } = require('../tools/generate/characterControlController');
const { applyStyleTransfer } = require('../tools/generate/styleTransferController');

// Convert
const { convertFile } = require('../tools/convert/fileConvertController');

// Basic
router.post('/crop', verifyToken, cropImage);
router.post('/resize', verifyToken, resizeImage);
router.post('/compress', verifyToken, compressImage);

// Enhance
router.post('/color-correction', verifyToken, correctColor);
router.post('/filter', verifyToken, applyFilter);
router.post('/sharpen', verifyToken, sharpenImage);
router.post('/noise-reduction', verifyToken, reduceNoise);

// AI-Edit
router.post('/bg-remove', verifyToken, removeBackground);
router.post('/inpaint', verifyToken, inpaintImage);
router.post('/outpaint', verifyToken, outpaintImage);
router.post('/upscale', verifyToken, upscaleImage);
router.post('/face-restore', verifyToken, restoreFace);
router.post('/old-photo-repair', verifyToken, repairOldPhoto);

// Generate
router.post('/text-to-image', verifyToken, generateImage);
router.post('/character-generate', verifyToken, generateCharacter);
router.post('/character-control', verifyToken, controlCharacter);
router.post('/style-transfer', verifyToken, applyStyleTransfer);

// Convert
router.post('/convert', verifyToken, convertFile);

module.exports = router;
