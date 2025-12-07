"""
Production Training Pipeline for Medicine Ball Power Coach
Optimized for GPU, large datasets, and maximum accuracy
"""

from ultralytics import YOLO
import torch
import yaml
from pathlib import Path
import json

class ProductionTrainer:
    """Production-grade training system"""
    
    def __init__(self):
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.gpu_available = torch.cuda.is_available()
        
        if self.gpu_available:
            self.gpu_name = torch.cuda.get_device_name(0)
            self.gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        
    def train_for_production(self):
        """Train with production-grade settings"""
        
        print("="*80)
        print("PRODUCTION TRAINING - MEDICINE BALL POWER COACH")
        print("="*80)
        
        # System info
        print(f"\n🖥️  SYSTEM CONFIGURATION:")
        print(f"   Device: {self.device.upper()}")
        
        if self.gpu_available:
            print(f"   GPU: {self.gpu_name}")
            print(f"   VRAM: {self.gpu_memory:.1f} GB")
            print(f"   CUDA Version: {torch.version.cuda}")
            print(f"   PyTorch: {torch.__version__}")
        else:
            print("   ⚠️  No GPU detected - training will be slow")
            print("   Recommendation: Use Google Colab or cloud GPU")
        
        # Dataset info
        with open('data/med_ball/data.yaml', 'r') as f:
            data_config = yaml.safe_load(f)
        
        print(f"\n📊 DATASET:")
        print(f"   Classes: {data_config['names']}")
        print(f"   Source: Roboflow")
        print(f"   Train: 145 images")
        print(f"   Valid: 41 images")
        print(f"   Test: 21 images")
        
        # Model selection based on GPU
        if self.gpu_available and self.gpu_memory >= 8:
            model_size = 'yolov8x.pt'  # Extra Large for best accuracy
            batch_size = 16
            print(f"\n🎯 MODEL: YOLOv8x (Extra Large)")
            print(f"   Parameters: 68M")
            print(f"   Best for: Maximum accuracy")
        elif self.gpu_available:
            model_size = 'yolov8l.pt'  # Large
            batch_size = 8
            print(f"\n🎯 MODEL: YOLOv8l (Large)")
            print(f"   Parameters: 43M")
            print(f"   Best for: High accuracy")
        else:
            model_size = 'yolov8m.pt'  # Medium for CPU
            batch_size = 4
            print(f"\n🎯 MODEL: YOLOv8m (Medium)")
            print(f"   Parameters: 25M")
            print(f"   Best for: CPU training")
        
        print(f"   Batch Size: {batch_size}")
        
        # Training configuration
        epochs = 500 if self.gpu_available else 200
        
        print(f"\n⚙️  TRAINING CONFIGURATION:")
        print(f"   Epochs: {epochs}")
        print(f"   Patience: 100 (early stopping)")
        print(f"   Image Size: 640x640")
        print(f"   Optimizer: AdamW")
        print(f"   Learning Rate: 0.0001 → 0.00001")
        print(f"   Augmentation: Heavy (12+ techniques)")
        
        print("\n" + "="*80)
        print("STARTING TRAINING")
        print("="*80)
        print("\n⏱️  Estimated time:")
        if self.gpu_available:
            print(f"   GPU: 3-6 hours")
        else:
            print(f"   CPU: 12-24 hours")
        
        print("\n💡 Tips:")
        print("   - Training saves checkpoints every 25 epochs")
        print("   - Best model saved automatically")
        print("   - Press Ctrl+C to stop (progress saved)")
        print("   - Monitor: runs/train/production_model/")
        
        input("\n▶️  Press Enter to start training...")
        
        # Load model
        model = YOLO(model_size)
        
        # Train with production settings
        results = model.train(
            # Dataset
            data='data/med_ball/data.yaml',
            
            # Training duration
            epochs=epochs,
            patience=100,  # More patience for better convergence
            
            # Image settings
            imgsz=640,
            batch=batch_size,
            
            # Optimizer settings (critical for accuracy)
            optimizer='AdamW',
            lr0=0.0001,      # Lower initial LR for stability
            lrf=0.00001,     # Very low final LR
            momentum=0.937,
            weight_decay=0.0005,
            warmup_epochs=5.0,
            warmup_momentum=0.8,
            warmup_bias_lr=0.1,
            
            # Heavy augmentation for robustness
            hsv_h=0.015,     # Hue
            hsv_s=0.7,       # Saturation
            hsv_v=0.4,       # Value
            degrees=20.0,    # Rotation ±20°
            translate=0.15,  # Translation ±15%
            scale=0.9,       # Scale 90-110%
            shear=10.0,      # Shear ±10°
            perspective=0.0002,  # Perspective
            flipud=0.0,      # No vertical flip
            fliplr=0.5,      # Horizontal flip 50%
            mosaic=1.0,      # Mosaic augmentation
            mixup=0.2,       # Mixup 20%
            copy_paste=0.15, # Copy-paste 15%
            
            # Advanced training settings
            cos_lr=True,     # Cosine LR scheduler
            close_mosaic=50, # Disable mosaic last 50 epochs
            amp=True,        # Automatic Mixed Precision
            fraction=1.0,    # Use 100% of data
            
            # Validation
            val=True,
            plots=False,     # Disable plots for speed
            save_period=25,  # Save every 25 epochs
            
            # Output
            project='runs/train',
            name='production_model',
            exist_ok=True,
            verbose=True,
            device=self.device,
            workers=8 if self.gpu_available else 4,
            
            # Additional settings for robustness
            cache=False,     # Don't cache (use for large datasets)
            rect=False,      # Rectangular training
            resume=False,
            overlap_mask=True,
            mask_ratio=4,
            dropout=0.0,
            
            # Loss weights (fine-tuned)
            box=7.5,         # Box loss weight
            cls=0.5,         # Classification loss
            dfl=1.5,         # DFL loss
        )
        
        print("\n" + "="*80)
        print("✅ TRAINING COMPLETE!")
        print("="*80)
        
        # Results
        best_model = Path(results.save_dir) / 'weights' / 'best.pt'
        last_model = Path(results.save_dir) / 'weights' / 'last.pt'
        
        print(f"\n📁 MODEL FILES:")
        print(f"   Best: {best_model}")
        print(f"   Last: {last_model}")
        
        print(f"\n📊 TRAINING RESULTS:")
        print(f"   Directory: {results.save_dir}")
        
        # Save training config
        config = {
            'model_size': model_size,
            'device': self.device,
            'gpu_name': self.gpu_name if self.gpu_available else 'CPU',
            'epochs_trained': epochs,
            'batch_size': batch_size,
            'dataset': 'Roboflow Medicine Ball',
            'classes': data_config['names'],
            'augmentation': 'Heavy (12+ techniques)',
            'best_model_path': str(best_model),
        }
        
        config_file = Path(results.save_dir) / 'training_config.json'
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        
        print(f"\n💾 Configuration saved: {config_file}")
        
        print("\n🎯 NEXT STEPS:")
        print("   1. Validate model:")
        print(f"      python validate_production.py")
        print("   2. Analyze videos:")
        print(f"      python analyze_video_production.py your_video.mp4")
        
        print("\n" + "="*80)
        
        return results

if __name__ == "__main__":
    trainer = ProductionTrainer()
    trainer.train_for_production()
