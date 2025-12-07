# Training Guide - Endurance Run Coach

## Overview

This guide covers training a high-accuracy gait analysis model using GPU acceleration and large-scale datasets.

## Prerequisites

### Hardware Requirements
- **GPU**: NVIDIA GPU with CUDA support (recommended: RTX 3060 or better)
- **RAM**: 16GB minimum, 32GB recommended
- **Storage**: 50GB+ for datasets and checkpoints

### Software Requirements
```bash
# Install CUDA Toolkit (if not already installed)
# Visit: https://developer.nvidia.com/cuda-downloads

# Verify CUDA installation
nvcc --version

# Install PyTorch with CUDA support
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Install training dependencies
cd model
pip install -r requirements.txt
```

## Dataset Collection

### 1. Roboflow Datasets

Sign up at [Roboflow](https://roboflow.com) and get your API key:

```bash
export ROBOFLOW_API_KEY="your_api_key_here"
```

Recommended datasets to search for:
- "running gait analysis"
- "human pose running"
- "treadmill running"
- "athletic pose detection"
- "marathon running"

### 2. Custom Video Collection

Collect diverse running videos:

**Camera Setup:**
- Side view or 30-45° angle
- 1080p or higher resolution
- 30+ fps
- Stable camera (tripod recommended)

**Diversity Requirements:**
- Multiple runners (different body types, ages, genders)
- Various paces (slow jog to sprint)
- Different environments (treadmill, track, trail, road)
- Lighting conditions (indoor, outdoor, dawn, dusk)
- Weather conditions (sunny, cloudy, rain)

**Minimum Dataset Size:**
- Training: 500+ videos (10-30 seconds each)
- Validation: 100+ videos
- Test: 50+ videos

### 3. Data Annotation

For supervised learning, annotate videos with:

**Gait Phase Labels:**
- Initial contact (foot strike)
- Mid-stance
- Toe-off
- Swing phase

**Form Quality Scores (0-10):**
- Overall form quality
- Specific issues:
  - Overstriding (0-1)
  - Vertical bounce (0-1)
  - Asymmetry (0-1)

**Tools for Annotation:**
- [CVAT](https://cvat.org/) - Computer Vision Annotation Tool
- [Label Studio](https://labelstud.io/)
- Custom annotation scripts

## Training Pipeline

### Quick Start

```bash
# Run complete training pipeline
python scripts/train_pipeline.py
```

This will:
1. Download datasets from Roboflow
2. Validate dataset quality
3. Train the model with GPU acceleration
4. Export to ONNX for production

### Manual Training

```python
from model.train_gait_model import train_model

# Train with custom parameters
model = train_model(
    dataset_path='datasets/running_gait',
    epochs=100,
    batch_size=16  # Adjust based on GPU memory
)
```

### Training Configuration

**Hyperparameters:**
```python
learning_rate = 0.001
batch_size = 8  # Increase with more GPU memory
epochs = 50-100
hidden_dim = 256
num_lstm_layers = 3
dropout = 0.3
```

**Data Augmentation:**
- Random brightness/contrast (±30%)
- Gaussian blur
- Hue/saturation variation
- Random gamma correction
- Horizontal flip (for symmetry)

### Monitoring Training

Training metrics are logged to TensorBoard:

```bash
tensorboard --logdir=runs
```

Monitor:
- Training/validation loss
- Phase classification accuracy
- Form score MAE
- Confidence calibration

## Model Architecture

### Multi-Task Learning

The model performs 4 tasks simultaneously:

1. **Gait Phase Classification**
   - 4 classes: contact, mid-stance, toe-off, swing
   - Per-frame predictions

2. **Form Quality Scoring**
   - Regression: 0-10 score
   - Overall running efficiency

3. **Issue Detection**
   - Binary classification for:
     - Overstriding
     - Vertical bounce
     - Asymmetry

4. **Confidence Estimation**
   - Self-assessed prediction confidence
   - Used for uncertainty quantification

### Architecture Details

```
Input: Pose sequence (30 frames × 132 features)
  ↓
Bidirectional LSTM (3 layers, 256 hidden units)
  ↓
Multi-head Attention (8 heads)
  ↓
Task-specific heads:
  ├─ Phase Classifier (LSTM output → 4 classes)
  ├─ Form Scorer (Pooled → 1 value)
  ├─ Issue Detector (Pooled → 3 values)
  └─ Confidence Estimator (Pooled → 1 value)
```

## Optimization Strategies

### GPU Acceleration

```python
# Enable mixed precision training
from torch.cuda.amp import autocast, GradScaler

scaler = GradScaler()

with autocast():
    outputs = model(inputs)
    loss = criterion(outputs, targets)

scaler.scale(loss).backward()
scaler.step(optimizer)
scaler.update()
```

### Distributed Training

For multiple GPUs:

```python
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel

# Initialize process group
dist.init_process_group(backend='nccl')

# Wrap model
model = DistributedDataParallel(model)
```

### Batch Size Optimization

Find optimal batch size:

```bash
# Start small and increase until OOM
python scripts/train_pipeline.py --batch-size 4
python scripts/train_pipeline.py --batch-size 8
python scripts/train_pipeline.py --batch-size 16
```

## Validation & Testing

### Cross-Validation

Stratified k-fold validation:
- Stratify by: pace, camera angle, environment
- k=5 folds recommended

### Test Metrics

**Phase Classification:**
- Accuracy
- F1-score per class
- Confusion matrix

**Form Scoring:**
- MAE (Mean Absolute Error)
- RMSE
- Correlation with expert ratings

**Confidence Calibration:**
- Expected Calibration Error (ECE)
- Reliability diagrams

### Testing Script

```bash
# Test on single video
python scripts/test_model.py path/to/video.mp4 --model checkpoints/best_model.pth

# Batch testing
python scripts/test_model.py datasets/test/*.mp4
```

## Production Deployment

### ONNX Export

```python
import torch.onnx

# Export trained model
torch.onnx.export(
    model,
    dummy_input,
    "checkpoints/gait_model.onnx",
    opset_version=14,
    dynamic_axes={'pose_sequence': {0: 'batch_size'}}
)
```

### Optimization

```bash
# Quantize for faster inference
python -m onnxruntime.quantization.preprocess --input gait_model.onnx --output gait_model_quantized.onnx
```

### Integration

The enhanced analyzer automatically loads trained models:

```python
from backend.gait_analyzer_enhanced import EnhancedGaitAnalyzer

analyzer = EnhancedGaitAnalyzer(
    model_path='checkpoints/best_model.pth',
    use_gpu=True
)

results = analyzer.analyze_video('video.mp4')
```

## Confidence Scoring

### Multi-Level Confidence

1. **Pose Detection Confidence**
   - MediaPipe visibility scores
   - Joint tracking stability

2. **Model Prediction Confidence**
   - Self-assessed via confidence head
   - Calibrated on validation set

3. **Overall Confidence**
   - Weighted combination
   - Reported to user with explanation

### Confidence Thresholds

- **High (>90%)**: Full body visible, stable tracking
- **Good (75-90%)**: Most joints tracked, minor occlusion
- **Moderate (60-75%)**: Some occlusion, reduced accuracy
- **Low (<60%)**: Significant issues, results unreliable

## Troubleshooting

### Common Issues

**Out of Memory (OOM):**
```bash
# Reduce batch size
--batch-size 4

# Enable gradient checkpointing
model.gradient_checkpointing_enable()
```

**Slow Training:**
```bash
# Increase num_workers
DataLoader(..., num_workers=8)

# Use pin_memory
DataLoader(..., pin_memory=True)
```

**Poor Convergence:**
- Reduce learning rate
- Increase batch size
- Add more data augmentation
- Check for data quality issues

## Best Practices

1. **Start Small**: Train on subset first to validate pipeline
2. **Monitor Overfitting**: Use early stopping
3. **Regular Checkpoints**: Save every 5 epochs
4. **Ablation Studies**: Test individual components
5. **Version Control**: Track model versions and hyperparameters
6. **Documentation**: Log all experiments

## Resources

- [MediaPipe Pose](https://google.github.io/mediapipe/solutions/pose.html)
- [PyTorch Documentation](https://pytorch.org/docs/)
- [Roboflow Universe](https://universe.roboflow.com/)
- [Running Biomechanics Research](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6358394/)

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review training logs
3. Validate dataset quality
4. Test with sample videos first
