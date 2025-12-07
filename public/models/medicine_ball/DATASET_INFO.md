# Dataset Information

## Dataset Source

**Name:** Med_Ball Dataset v1  
**Source:** Roboflow Universe  
**URL:** https://universe.roboflow.com/medball/med_ball/dataset/1  
**Workspace:** medball  
**Project:** med_ball  
**Version:** 1  
**License:** CC BY 4.0 (Creative Commons Attribution 4.0)  
**Export Date:** November 7, 2024 at 7:27 AM GMT  
**Created:** November 7, 2024 at 7:25 AM  

## Dataset Statistics

### Total Images: 207

**Split Distribution:**
- **Training Set:** 145 images (70.0%)
- **Validation Set:** 41 images (19.8%)
- **Test Set:** 21 images (10.1%)

### Classes (2 total):
1. **Athlete** - Person performing medicine ball exercises
2. **Medicine Ball** - The medicine ball object

### Annotation Format
- **Format:** YOLOv8 (YOLO format)
- **Structure:** Each image has a corresponding .txt file with bounding box annotations
- **Coordinates:** Normalized (x_center, y_center, width, height) with class ID

## Pre-processing Applied

The following pre-processing was applied to each image by Roboflow:

1. **Auto-orientation** - Pixel data auto-oriented with EXIF-orientation stripping
2. **Resize** - All images resized to 1280x1280 pixels (Fit with black edges)

**Note:** No image augmentation techniques were applied in the exported dataset.

## Dataset Structure

```
data/med_ball/
├── data.yaml                 # Dataset configuration file
├── README.dataset.txt        # Dataset readme
├── README.roboflow.txt       # Roboflow export information
├── train/
│   ├── images/              # 145 training images
│   └── labels/              # 145 training annotation files
├── valid/
│   ├── images/              # 41 validation images
│   └── labels/              # 41 validation annotation files
└── test/
    ├── images/              # 21 test images
    └── labels/              # 21 test annotation files
```

## Image Sources

Based on the filenames, images were extracted from video clips:
- **clip1_mp4** - Multiple frames from video clip 1
- **clip2_mp4** - Multiple frames from video clip 2
- **clip3_mp4** - Multiple frames from video clip 3
- **clip4_mp4** - Multiple frames from video clip 4

## Usage Rights

**License:** CC BY 4.0 (Creative Commons Attribution 4.0 International)

This means you can:
- ✓ Share — copy and redistribute the material
- ✓ Adapt — remix, transform, and build upon the material
- ✓ Commercial use — use for commercial purposes

**Requirements:**
- Attribution — You must give appropriate credit to the original creator

## Dataset Quality

### Strengths:
- ✓ Properly annotated with bounding boxes
- ✓ Two distinct classes (Athlete and Medicine Ball)
- ✓ Standardized image size (1280x1280)
- ✓ Proper train/val/test split
- ✓ YOLO format (ready for training)

### Limitations:
- Limited size (207 images total)
- No augmentation applied in export
- All images from 4 video clips (limited diversity)
- May need more varied conditions (lighting, angles, backgrounds)

## Recommendations for Improvement

### 1. Expand Dataset Size
- **Target:** 500-1000+ images
- **Method:** Record more videos in different conditions
- **Tools:** Roboflow for annotation

### 2. Increase Diversity
- Different lighting conditions (indoor/outdoor, day/night)
- Various camera angles (front, side, top)
- Multiple athletes (different body types, clothing)
- Different backgrounds and environments
- Various medicine ball sizes and colors

### 3. Add Augmentation
When training, use augmentation techniques:
- Rotation (±10-15°)
- Brightness/contrast adjustment
- Horizontal flipping
- Scaling (90-110%)
- Mosaic augmentation
- Mixup augmentation

### 4. Collect Edge Cases
- Partially occluded medicine balls
- Multiple people in frame
- Ball in motion (blurred)
- Extreme poses
- Low light conditions

## Current Training Configuration

**Model:** YOLOv8 (nano to extra-large variants)  
**Input Size:** 640x640 (standard) or 1280x1280 (high resolution)  
**Batch Size:** 4-16 (depending on hardware)  
**Epochs:** 200-500 with early stopping  
**Augmentation:** Applied during training (not in dataset)  

## How to Expand This Dataset

### Option 1: Roboflow (Recommended)
1. Go to https://universe.roboflow.com/medball/med_ball
2. Upload new images or videos
3. Use Roboflow's auto-annotation or manual annotation
4. Export updated dataset in YOLOv8 format
5. Replace data/med_ball/ folder

### Option 2: Manual Annotation
1. Record new videos
2. Extract frames using OpenCV or FFmpeg
3. Annotate using tools like:
   - LabelImg
   - CVAT
   - Roboflow (free tier)
4. Convert to YOLO format
5. Add to existing dataset

### Option 3: Data Augmentation
Use augmentation during training to artificially expand dataset:
- Implemented in train_advanced.py
- Implemented in train_optimized.py
- Creates variations without new images

## Dataset Performance Expectations

With current dataset size (207 images):

**Expected Metrics:**
- mAP50: 0.85-0.95 (85-95%)
- mAP50-95: 0.70-0.85 (70-85%)
- Precision: 0.80-0.95 (80-95%)
- Recall: 0.75-0.90 (75-90%)

**Factors Affecting Performance:**
- Model size (larger = better accuracy)
- Training epochs (more = better, with diminishing returns)
- Augmentation (helps generalization)
- Test conditions (similar to training = better results)

## Citation

If using this dataset, please provide attribution:

```
Med_Ball Dataset v1
Source: Roboflow Universe
URL: https://universe.roboflow.com/medball/med_ball/dataset/1
License: CC BY 4.0
Accessed: [Your Access Date]
```

## Contact & Support

**Roboflow Platform:** https://roboflow.com  
**Dataset URL:** https://universe.roboflow.com/medball/med_ball/dataset/1  
**Documentation:** https://docs.roboflow.com  
**Community:** https://discuss.roboflow.com  

## Version History

**v1 (Current)**
- Initial release: November 7, 2024
- 207 images total
- 2 classes: Athlete, Medicine Ball
- YOLOv8 format
- No augmentation applied

---

**Last Updated:** December 6, 2025  
**Dataset Version:** 1  
**Format:** YOLOv8  
**Total Images:** 207 (145 train / 41 val / 21 test)
