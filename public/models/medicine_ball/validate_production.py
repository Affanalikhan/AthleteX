"""
Validate Production Model
Test accuracy on validation and test sets
"""

from ultralytics import YOLO
from pathlib import Path

def validate_model():
    """Validate trained model"""
    
    print("="*80)
    print("MODEL VALIDATION")
    print("="*80)
    
    # Find best model
    model_path = Path('runs/train/production_model/weights/best.pt')
    
    if not model_path.exists():
        print(f"\n❌ Model not found: {model_path}")
        print("   Train model first: python train_production.py")
        return
    
    print(f"\n📦 Loading model: {model_path}")
    model = YOLO(str(model_path))
    
    print("\n🔍 Validating on test set...")
    print("-"*80)
    
    # Validate with multiple confidence thresholds
    for conf_thresh in [0.25, 0.5, 0.75]:
        print(f"\n📊 Confidence Threshold: {conf_thresh}")
        
        metrics = model.val(
            data='data/med_ball/data.yaml',
            split='test',
            imgsz=640,
            batch=16,
            conf=conf_thresh,
            iou=0.6,
            plots=False,
            verbose=False,
        )
        
        print(f"  mAP50:     {metrics.box.map50:.4f} ({metrics.box.map50*100:.1f}%)")
        print(f"  mAP50-95:  {metrics.box.map:.4f} ({metrics.box.map*100:.1f}%)")
        print(f"  Precision: {metrics.box.mp:.4f} ({metrics.box.mp*100:.1f}%)")
        print(f"  Recall:    {metrics.box.mr:.4f} ({metrics.box.mr*100:.1f}%)")
        
        # Per-class metrics
        print(f"\n  Per-class (conf={conf_thresh}):")
        for i, name in enumerate(['Athlete', 'Medicine Ball']):
            if i < len(metrics.box.ap50):
                print(f"    {name}:")
                print(f"      Precision: {metrics.box.p[i]*100:.1f}%")
                print(f"      Recall:    {metrics.box.r[i]*100:.1f}%")
                print(f"      mAP50:     {metrics.box.ap50[i]*100:.1f}%")
    
    print("\n" + "="*80)
    print("✅ VALIDATION COMPLETE")
    print("="*80)
    
    print("\n💡 RECOMMENDATIONS:")
    if metrics.box.map50 >= 0.95:
        print("  ✓ Excellent accuracy - ready for production")
    elif metrics.box.map50 >= 0.85:
        print("  ✓ Good accuracy - suitable for most use cases")
    elif metrics.box.map50 >= 0.75:
        print("  ⚠ Fair accuracy - consider more training data")
    else:
        print("  ⚠ Low accuracy - add more diverse training data")
    
    print(f"\n  Recommended confidence threshold: 0.5")
    print(f"  For high precision: use 0.75")
    print(f"  For high recall: use 0.25")

if __name__ == "__main__":
    validate_model()
