"""
Complete ML Training Pipeline for Vertical Jump Coach
Run this to train the model on your dataset
"""
import sys
import os
import argparse
from src.training.roboflow_loader import RoboflowLoader
from src.training.model_trainer import JumpLSTMModel, ModelTrainer, JumpDataset
from src.pose_estimation.opencv_pose_detector import OpenCVPoseDetector
from src.features.feature_extractor import FeatureExtractor
import numpy as np
from torch.utils.data import DataLoader
import torch


def extract_features_from_video(video_path: str, pose_detector, feature_extractor):
    """Extract features from a single video"""
    try:
        # Get pose sequence
        pose_sequence = pose_detector.process_video(video_path)
        
        if not pose_sequence or len(pose_sequence) < 10:
            return None
        
        # Extract features
        features = feature_extractor.extract_from_pose(pose_sequence)
        
        # Convert to feature vector (11 features)
        feature_vector = np.array([
            features.knee_flexion_left,
            features.knee_flexion_right,
            features.hip_hinge_depth,
            features.ankle_flexion_left,
            features.ankle_flexion_right,
            features.torso_alignment,
            features.arm_swing_timing / 1000.0,  # Normalize
            features.ground_contact_time / 1000.0,
            features.takeoff_velocity,
            features.left_right_symmetry,
            len(features.center_of_mass_trajectory) / 100.0  # Normalize
        ])
        
        return feature_vector
        
    except Exception as e:
        print(f"   ⚠️  Error processing {video_path}: {e}")
        return None


def prepare_dataset(dataset_path: str):
    """
    Prepare dataset for training
    
    Args:
        dataset_path: Path to dataset directory
        
    Returns:
        train_loader, val_loader
    """
    print("📊 Preparing dataset...")
    
    # Load dataset
    loader = RoboflowLoader()
    dataset = loader.load_local_dataset(dataset_path)
    
    # Initialize processors
    pose_detector = OpenCVPoseDetector()
    feature_extractor = FeatureExtractor()
    
    # Process training videos
    print("\n🔄 Processing training videos...")
    train_features = []
    train_labels = []
    
    for i, video_path in enumerate(dataset.train_videos[:100]):  # Limit for demo
        print(f"   Processing {i+1}/{min(100, len(dataset.train_videos))}: {os.path.basename(video_path)}")
        
        features = extract_features_from_video(video_path, pose_detector, feature_extractor)
        
        if features is not None:
            # Create sequence (repeat for temporal dimension)
            feature_sequence = np.tile(features, (60, 1))  # 60 frames
            train_features.append(feature_sequence)
            
            # Create dummy labels (replace with real annotations)
            train_labels.append({
                'jump_height': np.random.uniform(20, 80),
                'quality_score': np.random.uniform(50, 100),
                'velocity': np.random.uniform(1, 4),
                'timing': np.random.uniform(0.5, 2.0),
                'errors': np.random.randint(0, 2, 5).astype(float)
            })
    
    print(f"✅ Processed {len(train_features)} training samples")
    
    # Process test videos
    print("\n🔄 Processing test videos...")
    test_features = []
    test_labels = []
    
    for i, video_path in enumerate(dataset.test_videos[:20]):  # Limit for demo
        print(f"   Processing {i+1}/{min(20, len(dataset.test_videos))}: {os.path.basename(video_path)}")
        
        features = extract_features_from_video(video_path, pose_detector, feature_extractor)
        
        if features is not None:
            feature_sequence = np.tile(features, (60, 1))
            test_features.append(feature_sequence)
            
            test_labels.append({
                'jump_height': np.random.uniform(20, 80),
                'quality_score': np.random.uniform(50, 100),
                'velocity': np.random.uniform(1, 4),
                'timing': np.random.uniform(0.5, 2.0),
                'errors': np.random.randint(0, 2, 5).astype(float)
            })
    
    print(f"✅ Processed {len(test_features)} test samples")
    
    # Create datasets
    train_dataset = JumpDataset(train_features, train_labels)
    test_dataset = JumpDataset(test_features, test_labels)
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=16, shuffle=False)
    
    return train_loader, test_loader


def main():
    parser = argparse.ArgumentParser(description='Train Vertical Jump Analysis Model')
    parser.add_argument('--dataset', type=str, default='data/sample_dataset',
                       help='Path to dataset directory')
    parser.add_argument('--epochs', type=int, default=50,
                       help='Number of training epochs')
    parser.add_argument('--output', type=str, default='models/jump_model.pth',
                       help='Output path for trained model')
    parser.add_argument('--download', action='store_true',
                       help='Download dataset from Roboflow')
    parser.add_argument('--workspace', type=str, default='',
                       help='Roboflow workspace name')
    parser.add_argument('--project', type=str, default='',
                       help='Roboflow project name')
    
    args = parser.parse_args()
    
    print("🏀 Vertical Jump Coach - ML Training Pipeline")
    print("=" * 60)
    
    # Download dataset if requested
    if args.download:
        if not args.workspace or not args.project:
            print("❌ Error: --workspace and --project required for download")
            print("\nExample:")
            print("  python train_model.py --download --workspace myworkspace --project vertical-jump")
            return 1
        
        print("\n📥 Downloading dataset from Roboflow...")
        loader = RoboflowLoader()
        args.dataset = loader.download_dataset(args.workspace, args.project)
    
    # Check if dataset exists
    if not os.path.exists(args.dataset):
        print(f"\n❌ Dataset not found: {args.dataset}")
        print("\nOptions:")
        print("  1. Create sample dataset:")
        print("     python -c \"from src.training.roboflow_loader import RoboflowLoader; RoboflowLoader().create_sample_dataset()\"")
        print("\n  2. Download from Roboflow:")
        print("     python train_model.py --download --workspace YOUR_WORKSPACE --project YOUR_PROJECT")
        print("\n  3. Use existing dataset:")
        print("     python train_model.py --dataset /path/to/dataset")
        return 1
    
    # Prepare dataset
    try:
        train_loader, val_loader = prepare_dataset(args.dataset)
    except Exception as e:
        print(f"\n❌ Error preparing dataset: {e}")
        return 1
    
    # Create model
    print("\n🤖 Creating model...")
    model = JumpLSTMModel(input_size=11, hidden_size=128, num_layers=2)
    print(f"✅ Model created")
    print(f"   Parameters: {sum(p.numel() for p in model.parameters()):,}")
    print(f"   Device: {'CUDA' if torch.cuda.is_available() else 'CPU'}")
    
    # Train model
    print(f"\n🚀 Starting training...")
    print(f"   Epochs: {args.epochs}")
    print(f"   Output: {args.output}")
    
    trainer = ModelTrainer(model)
    history = trainer.train(train_loader, val_loader, num_epochs=args.epochs, save_path=args.output)
    
    # Save history
    trainer.save_history()
    
    print("\n" + "=" * 60)
    print("🎉 TRAINING COMPLETE!")
    print("=" * 60)
    print(f"\n✅ Model saved to: {args.output}")
    print(f"✅ Training history saved to: models/training_history.json")
    print(f"\n📊 Final Results:")
    print(f"   Best validation loss: {min(history['val_loss']):.4f}")
    print(f"   Best validation MAE: {min(history['val_mae']):.4f}")
    
    print("\n📝 Next steps:")
    print("   1. Review training history")
    print("   2. Test model on new videos")
    print("   3. Integrate into jump analyzer")
    print("   4. Deploy to production")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
