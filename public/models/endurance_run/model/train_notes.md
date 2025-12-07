# Model Training Notes

## Dataset Requirements

### Data Sources
- **Roboflow Running Gait Datasets**
  - Search for "running gait", "running pose", "treadmill running"
  - Minimum 500+ annotated videos
  - Multiple runners, paces, body types

- **Custom Collection**
  - Outdoor running (trails, roads, tracks)
  - Treadmill running (gym environments)
  - Various camera angles (side view, 30-45°)
  - Different lighting conditions

### Annotations Needed
- Joint keypoints (33 landmarks via MediaPipe)
- Gait phase labels (contact, mid-stance, toe-off, swing)
- Foot strike type (heel, midfoot, forefoot)
- Quality labels (good form vs poor form)

## Training Strategy

### Base Model
- Start with MediaPipe Pose (BlazePose architecture)
- Pre-trained on COCO dataset
- 33 body landmarks with visibility scores

### Fine-tuning Approach
1. **Phase 1**: Pose detection accuracy
   - Focus on ankle, knee, hip tracking
   - Augment with motion blur, lighting changes
   
2. **Phase 2**: Gait phase classification
   - Train temporal model (LSTM/Transformer) on pose sequences
   - Classify stride phases
   
3. **Phase 3**: Form quality scoring
   - Supervised learning on expert-labeled "good" vs "needs improvement"
   - Multi-task learning for specific issues (overstriding, vertical bounce)

### Augmentation
- Horizontal flip (for left/right symmetry)
- Brightness/contrast adjustment
- Camera angle simulation (±15°)
- Background replacement
- Clothing/runner diversity

### Validation
- Hold out 20% test set
- Stratify by:
  - Running pace (slow, moderate, fast)
  - Camera angle
  - Indoor vs outdoor
- Metrics:
  - Joint detection accuracy (PCK@0.1)
  - Gait phase classification F1
  - Form score correlation with expert ratings

## Deployment
- Export to ONNX for faster inference
- Optimize for CPU (most users won't have GPU)
- Target: <5 seconds processing for 15-second video

## Confidence Scoring
- Based on:
  - Joint visibility scores
  - Temporal consistency
  - Number of complete stride cycles detected
- Report honestly (don't claim 100% if uncertain)
