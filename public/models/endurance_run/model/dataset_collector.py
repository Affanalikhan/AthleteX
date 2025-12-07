"""
Dataset collection from Roboflow and other sources for running gait analysis
"""
import os
import requests
from pathlib import Path
import json
from roboflow import Roboflow
import cv2
import numpy as np

class DatasetCollector:
    def __init__(self, output_dir="datasets"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
    def download_roboflow_datasets(self, api_key):
        """Download running gait datasets from Roboflow"""
        rf = Roboflow(api_key=api_key)
        
        # List of relevant running/gait analysis datasets
        datasets_to_download = [
            "running-gait-analysis",
            "human-pose-running",
            "treadmill-running",
            "athletic-pose-detection",
            "sports-pose-estimation"
        ]
        
        downloaded = []
        for dataset_name in datasets_to_download:
            try:
                print(f"Searching for dataset: {dataset_name}")
                workspace = rf.workspace()
                project = workspace.project(dataset_name)
                version = project.version(1)
                
                dataset_path = self.output_dir / dataset_name
                dataset = version.download("coco", location=str(dataset_path))
                downloaded.append(dataset_path)
                print(f"✓ Downloaded: {dataset_name}")
            except Exception as e:
                print(f"✗ Could not download {dataset_name}: {e}")
        
        return downloaded
    
    def collect_youtube_running_videos(self):
        """
        Placeholder for YouTube video collection
        In production, use youtube-dl or similar with proper licensing
        """
        print("Note: For YouTube videos, ensure proper licensing and permissions")
        print("Recommended sources:")
        print("- Running form analysis channels")
        print("- Marathon/race footage (with permission)")
        print("- Training videos from coaches")
        return []
    
    def augment_dataset(self, video_path, output_dir):
        """Apply augmentation to increase dataset diversity"""
        cap = cv2.VideoCapture(str(video_path))
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        augmentations = [
            ('original', lambda x: x),
            ('brightness_up', lambda x: cv2.convertScaleAbs(x, alpha=1.3, beta=20)),
            ('brightness_down', lambda x: cv2.convertScaleAbs(x, alpha=0.7, beta=-20)),
            ('contrast', lambda x: cv2.convertScaleAbs(x, alpha=1.5, beta=0)),
            ('blur', lambda x: cv2.GaussianBlur(x, (5, 5), 0)),
        ]
        
        for aug_name, aug_func in augmentations:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = None
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                augmented = aug_func(frame)
                
                if out is None:
                    h, w = augmented.shape[:2]
                    out_path = output_path / f"{Path(video_path).stem}_{aug_name}.mp4"
                    out = cv2.VideoWriter(str(out_path), fourcc, 30.0, (w, h))
                
                out.write(augmented)
            
            if out:
                out.release()
        
        cap.release()
        print(f"✓ Augmented: {video_path}")
    
    def validate_dataset(self, dataset_path):
        """Validate dataset quality and completeness"""
        dataset_path = Path(dataset_path)
        
        stats = {
            'total_videos': 0,
            'total_frames': 0,
            'avg_duration': 0,
            'resolutions': {},
            'quality_issues': []
        }
        
        video_files = list(dataset_path.glob('**/*.mp4')) + list(dataset_path.glob('**/*.avi'))
        stats['total_videos'] = len(video_files)
        
        durations = []
        for video_file in video_files:
            cap = cv2.VideoCapture(str(video_file))
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            stats['total_frames'] += frame_count
            duration = frame_count / fps if fps > 0 else 0
            durations.append(duration)
            
            res_key = f"{width}x{height}"
            stats['resolutions'][res_key] = stats['resolutions'].get(res_key, 0) + 1
            
            if duration < 5:
                stats['quality_issues'].append(f"{video_file.name}: too short ({duration:.1f}s)")
            if width < 640 or height < 480:
                stats['quality_issues'].append(f"{video_file.name}: low resolution ({res_key})")
            
            cap.release()
        
        stats['avg_duration'] = np.mean(durations) if durations else 0
        
        return stats

if __name__ == "__main__":
    collector = DatasetCollector()
    
    # Example usage
    print("Dataset Collector for Running Gait Analysis")
    print("=" * 50)
    print("\nTo use:")
    print("1. Set ROBOFLOW_API_KEY environment variable")
    print("2. Run: python dataset_collector.py")
    print("\nOr use programmatically:")
    print("  collector = DatasetCollector()")
    print("  collector.download_roboflow_datasets(api_key)")
