"""
Train Medicine Ball Detection Model for Maximum Accuracy
Uses your Roboflow dataset with extensive augmentation
"""

from ultralytics import YOLO
import torch

def train_accurate_model():
    """Train with maximum accuracy settings"""
    
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    
    print("="*70)
    print("TRAINING FOR MAXIMUM ACCURACY")
    print("="*70)
    print(f"Device: {device}")
    print(f"Dataset: data/med_ball/data.yaml")
    print(f"Model: YOLOv8m (Medium - Good balance)")
    print("="*70)
    
    # Use medium model for good accuracy/speed balance
    model = YOLO('yolov8m.pt')
    
    print("\nStarting training...")
    print("This will take several hours. Press Ctrl+C to stop.\n")
    
    results = model.train(
        # Dataset
        data='data/med_ball/data.yaml',
        
        # Training duration
        epochs=300,
        patience=50,
        
        # Image settings
        imgsz=640,
        batch=8 if device == 'cpu' else 16,
        
        # Optimizer
        optimizer='AdamW',
        lr0=0.001,
        lrf=0.01,
        momentum=0.937,
        weight_decay=0.0005,
        warmup_epochs=3.0,
        
        # Heavy augmentation for better generalization
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
        degrees=15.0,      # More rotation
        translate=0.1,
        scale=0.9,
        shear=5.0,
        perspective=0.0001,
        flipud=0.0,
        fliplr=0.5,
        mosaic=1.0,
        mixup=0.15,        # More mixup
        copy_paste=0.1,
        
        # Training settings
        cos_lr=True,
        close_mosaic=20,
        amp=True,
        fraction=1.0,
        
        # Validation
        val=True,
        plots=False,
        save_period=25,
        
        # Output
        project='runs/train',
        name='medicine_ball_accurate',
        exist_ok=True,
        verbose=True,
        device=device,
        workers=4,
    )
    
    print("\n" + "="*70)
    print("TRAINING COMPLETE!")
    print("="*70)
    print(f"Best model: {results.save_dir}/weights/best.pt")
    print(f"Last model: {results.save_dir}/weights/last.pt")
    print("\nTo use trained model:")
    print("  python analyze_video.py your_video.mp4")
    print("="*70)

if __name__ == "__main__":
    train_accurate_model()
