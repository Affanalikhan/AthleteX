"""
Roboflow dataset loader for training ML model
"""
import os
import json
from typing import List, Dict, Tuple
from dataclasses import dataclass


@dataclass
class TrainingDataset:
    """Container for training data"""
    train_videos: List[str]
    test_videos: List[str]
    annotations: Dict[str, any]
    metadata: Dict[str, any]


class RoboflowLoader:
    """Load and prepare data from Roboflow for training"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('ROBOFLOW_API_KEY')
        self.dataset_path = None
        
    def download_dataset(self, workspace: str, project: str, version: int = 1) -> str:
        """
        Download dataset from Roboflow
        
        Args:
            workspace: Roboflow workspace name
            project: Project name (e.g., 'vertical-jump-dataset')
            version: Dataset version
            
        Returns:
            Path to downloaded dataset
        """
        try:
            from roboflow import Roboflow
            
            print(f"📥 Downloading dataset from Roboflow...")
            print(f"   Workspace: {workspace}")
            print(f"   Project: {project}")
            print(f"   Version: {version}")
            
            rf = Roboflow(api_key=self.api_key)
            project_obj = rf.workspace(workspace).project(project)
            dataset = project_obj.version(version).download("coco")
            
            self.dataset_path = dataset.location
            print(f"✅ Dataset downloaded to: {self.dataset_path}")
            
            return self.dataset_path
            
        except ImportError:
            print("❌ Roboflow library not installed")
            print("   Install with: pip install roboflow")
            raise
        except Exception as e:
            print(f"❌ Error downloading dataset: {e}")
            raise
    
    def load_local_dataset(self, dataset_path: str) -> TrainingDataset:
        """
        Load dataset from local path
        
        Args:
            dataset_path: Path to dataset directory
            
        Returns:
            TrainingDataset object
        """
        print(f"📂 Loading dataset from: {dataset_path}")
        
        # Load annotations
        train_annotations = self._load_annotations(
            os.path.join(dataset_path, 'train', '_annotations.coco.json')
        )
        test_annotations = self._load_annotations(
            os.path.join(dataset_path, 'test', '_annotations.coco.json')
        )
        
        # Get video lists
        train_videos = self._get_video_list(os.path.join(dataset_path, 'train'))
        test_videos = self._get_video_list(os.path.join(dataset_path, 'test'))
        
        print(f"✅ Loaded {len(train_videos)} training videos")
        print(f"✅ Loaded {len(test_videos)} test videos")
        
        return TrainingDataset(
            train_videos=train_videos,
            test_videos=test_videos,
            annotations={'train': train_annotations, 'test': test_annotations},
            metadata=self._extract_metadata(train_annotations)
        )
    
    def _load_annotations(self, annotation_file: str) -> Dict:
        """Load COCO format annotations"""
        if not os.path.exists(annotation_file):
            print(f"⚠️  Annotation file not found: {annotation_file}")
            return {}
        
        with open(annotation_file, 'r') as f:
            return json.load(f)
    
    def _get_video_list(self, directory: str) -> List[str]:
        """Get list of video files in directory"""
        if not os.path.exists(directory):
            return []
        
        video_extensions = ['.mp4', '.mov', '.avi', '.mkv']
        videos = []
        
        for file in os.listdir(directory):
            if any(file.lower().endswith(ext) for ext in video_extensions):
                videos.append(os.path.join(directory, file))
        
        return videos
    
    def _extract_metadata(self, annotations: Dict) -> Dict:
        """Extract metadata from annotations"""
        if not annotations:
            return {}
        
        return {
            'num_images': len(annotations.get('images', [])),
            'num_annotations': len(annotations.get('annotations', [])),
            'categories': annotations.get('categories', [])
        }
    
    def create_sample_dataset(self, output_dir: str = 'data/sample_dataset'):
        """
        Create a sample dataset structure for testing
        This simulates what Roboflow would provide
        """
        print(f"📝 Creating sample dataset at: {output_dir}")
        
        os.makedirs(os.path.join(output_dir, 'train'), exist_ok=True)
        os.makedirs(os.path.join(output_dir, 'test'), exist_ok=True)
        
        # Create sample annotation files
        sample_annotation = {
            "images": [
                {
                    "id": 1,
                    "file_name": "jump_001.mp4",
                    "width": 1920,
                    "height": 1080
                }
            ],
            "annotations": [
                {
                    "id": 1,
                    "image_id": 1,
                    "category_id": 1,
                    "keypoints": [100, 200, 1] * 17,  # 17 keypoints
                    "num_keypoints": 17
                }
            ],
            "categories": [
                {
                    "id": 1,
                    "name": "person",
                    "keypoints": [
                        "nose", "left_eye", "right_eye", "left_ear", "right_ear",
                        "left_shoulder", "right_shoulder", "left_elbow", "right_elbow",
                        "left_wrist", "right_wrist", "left_hip", "right_hip",
                        "left_knee", "right_knee", "left_ankle", "right_ankle"
                    ]
                }
            ]
        }
        
        # Save sample annotations
        with open(os.path.join(output_dir, 'train', '_annotations.coco.json'), 'w') as f:
            json.dump(sample_annotation, f, indent=2)
        
        with open(os.path.join(output_dir, 'test', '_annotations.coco.json'), 'w') as f:
            json.dump(sample_annotation, f, indent=2)
        
        print("✅ Sample dataset created")
        print(f"   Location: {output_dir}")
        print("\n📝 To use real data:")
        print("   1. Sign up at https://roboflow.com")
        print("   2. Create/find a vertical jump dataset")
        print("   3. Use download_dataset() method")
        
        return output_dir


# Example usage
if __name__ == "__main__":
    # Create sample dataset for testing
    loader = RoboflowLoader()
    sample_path = loader.create_sample_dataset()
    
    # Load the sample dataset
    dataset = loader.load_local_dataset(sample_path)
    print(f"\n✅ Dataset ready for training!")
    print(f"   Train videos: {len(dataset.train_videos)}")
    print(f"   Test videos: {len(dataset.test_videos)}")
