"""
Complete training pipeline script
Run this to train the model on collected datasets
"""
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from model.dataset_collector import DatasetCollector
from model.train_gait_model import train_model
import torch

def main():
    print("=" * 70)
    print("ENDURANCE RUN COACH - MODEL TRAINING PIPELINE")
    print("=" * 70)
    
    # Check GPU
    if torch.cuda.is_available():
        print(f"\n✓ GPU Available: {torch.cuda.get_device_name(0)}")
        print(f"  CUDA Version: {torch.version.cuda}")
        print(f"  Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    else:
        print("\n⚠ No GPU detected. Training will use CPU (slower)")
    
    # Step 1: Dataset Collection
    print("\n" + "=" * 70)
    print("STEP 1: DATASET COLLECTION")
    print("=" * 70)
    
    collector = DatasetCollector(output_dir="datasets")
    
    roboflow_key = os.getenv("ROBOFLOW_API_KEY")
    if roboflow_key:
        print("\n📥 Downloading datasets from Roboflow...")
        datasets = collector.download_roboflow_datasets(roboflow_key)
        print(f"✓ Downloaded {len(datasets)} datasets")
    else:
        print("\n⚠ ROBOFLOW_API_KEY not set. Skipping Roboflow download.")
        print("  To download datasets, set: export ROBOFLOW_API_KEY=your_key")
    
    # Step 2: Dataset Validation
    print("\n" + "=" * 70)
    print("STEP 2: DATASET VALIDATION")
    print("=" * 70)
    
    dataset_path = Path("datasets")
    if dataset_path.exists():
        print("\n📊 Validating datasets...")
        stats = collector.validate_dataset(dataset_path)
        print(f"\nDataset Statistics:")
        print(f"  Total videos: {stats['total_videos']}")
        print(f"  Total frames: {stats['total_frames']}")
        print(f"  Avg duration: {stats['avg_duration']:.1f}s")
        print(f"  Resolutions: {stats['resolutions']}")
        if stats['quality_issues']:
            print(f"\n⚠ Quality issues found: {len(stats['quality_issues'])}")
            for issue in stats['quality_issues'][:5]:
                print(f"    - {issue}")
    else:
        print("\n⚠ No datasets found. Please add videos to 'datasets/' directory")
        print("  Recommended structure:")
        print("    datasets/")
        print("      ├── training/")
        print("      │   ├── video1.mp4")
        print("      │   └── video2.mp4")
        print("      └── validation/")
        print("          ├── video1.mp4")
        print("          └── video2.mp4")
        return
    
    # Step 3: Model Training
    print("\n" + "=" * 70)
    print("STEP 3: MODEL TRAINING")
    print("=" * 70)
    
    response = input("\n🚀 Start training? (y/n): ")
    if response.lower() != 'y':
        print("Training cancelled.")
        return
    
    epochs = int(input("Number of epochs (default 50): ") or "50")
    batch_size = int(input("Batch size (default 8): ") or "8")
    
    print(f"\n🏋️ Training model for {epochs} epochs with batch size {batch_size}...")
    print("This may take several hours depending on dataset size and hardware.")
    
    try:
        model = train_model(
            dataset_path=str(dataset_path),
            epochs=epochs,
            batch_size=batch_size
        )
        print("\n✓ Training complete!")
        print("  Model saved to: checkpoints/best_model.pth")
    except Exception as e:
        print(f"\n✗ Training failed: {e}")
        return
    
    # Step 4: Model Export
    print("\n" + "=" * 70)
    print("STEP 4: MODEL EXPORT")
    print("=" * 70)
    
    export_onnx = input("\n📦 Export to ONNX for production? (y/n): ")
    if export_onnx.lower() == 'y':
        print("Exporting to ONNX...")
        try:
            dummy_input = torch.randn(1, 30, 132).to(
                torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            )
            torch.onnx.export(
                model,
                dummy_input,
                "checkpoints/gait_model.onnx",
                export_params=True,
                opset_version=14,
                input_names=['pose_sequence'],
                output_names=['phase_logits', 'form_score', 'issues', 'confidence'],
                dynamic_axes={
                    'pose_sequence': {0: 'batch_size'},
                }
            )
            print("✓ ONNX model saved to: checkpoints/gait_model.onnx")
        except Exception as e:
            print(f"⚠ ONNX export failed: {e}")
    
    print("\n" + "=" * 70)
    print("TRAINING PIPELINE COMPLETE!")
    print("=" * 70)
    print("\nNext steps:")
    print("1. Test the model: python scripts/test_model.py")
    print("2. Start the API server: cd backend && python main.py")
    print("3. The enhanced analyzer will automatically use the trained model")

if __name__ == "__main__":
    main()
