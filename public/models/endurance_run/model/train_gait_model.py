"""
Training pipeline for running gait analysis with GPU acceleration
Combines pose detection, gait phase classification, and form scoring
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import cv2
import numpy as np
from pathlib import Path
import json
from tqdm import tqdm
import mediapipe as mp
from sklearn.model_selection import train_test_split
import albumentations as A

# Check GPU availability
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"CUDA Version: {torch.version.cuda}")

class RunningGaitDataset(Dataset):
    """Dataset for running gait videos with pose annotations"""
    
    def __init__(self, video_paths, annotations, transform=None, sequence_length=30):
        self.video_paths = video_paths
        self.annotations = annotations
        self.transform = transform
        self.sequence_length = sequence_length
        self.mp_pose = mp.solutions.pose.Pose(
            static_image_mode=False,
            model_complexity=2,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
    
    def __len__(self):
        return len(self.video_paths)
    
    def __getitem__(self, idx):
        video_path = self.video_paths[idx]
        annotation = self.annotations[idx]
        
        # Extract pose sequences from video
        cap = cv2.VideoCapture(str(video_path))
        frames = []
        pose_sequences = []
        
        frame_count = 0
        while cap.isOpened() and frame_count < self.sequence_length:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Apply augmentation
            if self.transform:
                frame = self.transform(image=frame)['image']
            
            # Extract pose
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.mp_pose.process(rgb_frame)
            
            if results.pose_landmarks:
                landmarks = []
                for lm in results.pose_landmarks.landmark:
                    landmarks.extend([lm.x, lm.y, lm.z, lm.visibility])
                pose_sequences.append(landmarks)
            
            frame_count += 1
        
        cap.release()
        
        # Pad sequences if needed
        while len(pose_sequences) < self.sequence_length:
            pose_sequences.append([0] * (33 * 4))  # 33 landmarks, 4 values each
        
        pose_tensor = torch.FloatTensor(pose_sequences[:self.sequence_length])
        
        # Labels: gait phase, form quality, specific issues
        labels = {
            'gait_phase': torch.LongTensor(annotation.get('gait_phases', [0] * self.sequence_length)),
            'form_score': torch.FloatTensor([annotation.get('form_score', 5.0)]),
            'overstriding': torch.FloatTensor([annotation.get('overstriding', 0.0)]),
            'vertical_bounce': torch.FloatTensor([annotation.get('vertical_bounce', 0.0)]),
            'asymmetry': torch.FloatTensor([annotation.get('asymmetry', 0.0)])
        }
        
        return pose_tensor, labels

class GaitAnalysisModel(nn.Module):
    """
    Multi-task model for gait analysis:
    - Gait phase classification (contact, mid-stance, toe-off, swing)
    - Form quality scoring
    - Specific issue detection (overstriding, bounce, asymmetry)
    """
    
    def __init__(self, input_dim=132, hidden_dim=256, num_phases=4):
        super(GaitAnalysisModel, self).__init__()
        
        # Bidirectional LSTM for temporal modeling
        self.lstm = nn.LSTM(
            input_dim, 
            hidden_dim, 
            num_layers=3, 
            batch_first=True, 
            bidirectional=True,
            dropout=0.3
        )
        
        # Attention mechanism
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_dim * 2,
            num_heads=8,
            dropout=0.2
        )
        
        # Task-specific heads
        self.phase_classifier = nn.Sequential(
            nn.Linear(hidden_dim * 2, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, num_phases)
        )
        
        self.form_scorer = nn.Sequential(
            nn.Linear(hidden_dim * 2, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 1),
            nn.Sigmoid()
        )
        
        self.issue_detector = nn.Sequential(
            nn.Linear(hidden_dim * 2, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 3),  # overstriding, bounce, asymmetry
            nn.Sigmoid()
        )
        
        # Confidence estimator
        self.confidence_estimator = nn.Sequential(
            nn.Linear(hidden_dim * 2, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )
    
    def forward(self, x):
        # x shape: (batch, sequence_length, input_dim)
        lstm_out, _ = self.lstm(x)
        
        # Apply attention
        attn_out, attn_weights = self.attention(
            lstm_out.transpose(0, 1),
            lstm_out.transpose(0, 1),
            lstm_out.transpose(0, 1)
        )
        attn_out = attn_out.transpose(0, 1)
        
        # Global average pooling for sequence-level features
        pooled = torch.mean(attn_out, dim=1)
        
        # Multi-task outputs
        phase_logits = self.phase_classifier(attn_out)
        form_score = self.form_scorer(pooled) * 10  # Scale to 0-10
        issues = self.issue_detector(pooled)
        confidence = self.confidence_estimator(pooled)
        
        return {
            'phase_logits': phase_logits,
            'form_score': form_score,
            'issues': issues,
            'confidence': confidence,
            'attention_weights': attn_weights
        }

class GaitTrainer:
    """Training pipeline with GPU acceleration"""
    
    def __init__(self, model, device, learning_rate=0.001):
        self.model = model.to(device)
        self.device = device
        self.optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=0.01)
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer, mode='min', patience=5, factor=0.5
        )
        
        # Loss functions
        self.phase_criterion = nn.CrossEntropyLoss()
        self.regression_criterion = nn.MSELoss()
        self.bce_criterion = nn.BCELoss()
    
    def train_epoch(self, train_loader):
        self.model.train()
        total_loss = 0
        
        pbar = tqdm(train_loader, desc="Training")
        for batch_idx, (poses, labels) in enumerate(pbar):
            poses = poses.to(self.device)
            
            # Move labels to device
            gait_phases = labels['gait_phase'].to(self.device)
            form_scores = labels['form_score'].to(self.device)
            overstriding = labels['overstriding'].to(self.device)
            vertical_bounce = labels['vertical_bounce'].to(self.device)
            asymmetry = labels['asymmetry'].to(self.device)
            
            self.optimizer.zero_grad()
            
            # Forward pass
            outputs = self.model(poses)
            
            # Multi-task loss
            phase_loss = self.phase_criterion(
                outputs['phase_logits'].reshape(-1, 4),
                gait_phases.reshape(-1)
            )
            form_loss = self.regression_criterion(
                outputs['form_score'].squeeze(),
                form_scores.squeeze()
            )
            
            issues_target = torch.stack([overstriding, vertical_bounce, asymmetry], dim=1).squeeze()
            issues_loss = self.bce_criterion(outputs['issues'], issues_target)
            
            # Confidence loss (encourage high confidence on correct predictions)
            confidence_loss = -torch.mean(outputs['confidence'])
            
            # Combined loss
            loss = phase_loss + form_loss + issues_loss + 0.1 * confidence_loss
            
            loss.backward()
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            self.optimizer.step()
            
            total_loss += loss.item()
            pbar.set_postfix({'loss': loss.item()})
        
        return total_loss / len(train_loader)
    
    def validate(self, val_loader):
        self.model.eval()
        total_loss = 0
        correct_phases = 0
        total_phases = 0
        
        with torch.no_grad():
            for poses, labels in tqdm(val_loader, desc="Validating"):
                poses = poses.to(self.device)
                gait_phases = labels['gait_phase'].to(self.device)
                form_scores = labels['form_score'].to(self.device)
                
                outputs = self.model(poses)
                
                phase_loss = self.phase_criterion(
                    outputs['phase_logits'].reshape(-1, 4),
                    gait_phases.reshape(-1)
                )
                form_loss = self.regression_criterion(
                    outputs['form_score'].squeeze(),
                    form_scores.squeeze()
                )
                
                loss = phase_loss + form_loss
                total_loss += loss.item()
                
                # Accuracy
                phase_preds = torch.argmax(outputs['phase_logits'], dim=-1)
                correct_phases += (phase_preds == gait_phases).sum().item()
                total_phases += gait_phases.numel()
        
        avg_loss = total_loss / len(val_loader)
        accuracy = correct_phases / total_phases
        
        return avg_loss, accuracy
    
    def save_checkpoint(self, path, epoch, val_loss, val_acc):
        torch.save({
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'val_loss': val_loss,
            'val_acc': val_acc,
        }, path)
        print(f"✓ Checkpoint saved: {path}")

def train_model(dataset_path, epochs=50, batch_size=8):
    """Main training function"""
    
    # Data augmentation
    transform = A.Compose([
        A.RandomBrightnessContrast(p=0.5),
        A.GaussianBlur(p=0.3),
        A.HueSaturationValue(p=0.3),
        A.RandomGamma(p=0.3),
    ])
    
    # Load dataset (placeholder - implement actual loading)
    print("Loading dataset...")
    video_paths = list(Path(dataset_path).glob('**/*.mp4'))
    annotations = [{'form_score': 7.0, 'gait_phases': [0] * 30} for _ in video_paths]
    
    # Split dataset
    train_videos, val_videos, train_annot, val_annot = train_test_split(
        video_paths, annotations, test_size=0.2, random_state=42
    )
    
    train_dataset = RunningGaitDataset(train_videos, train_annot, transform=transform)
    val_dataset = RunningGaitDataset(val_videos, val_annot)
    
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=4)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=4)
    
    # Initialize model
    model = GaitAnalysisModel()
    trainer = GaitTrainer(model, device)
    
    # Training loop
    best_val_loss = float('inf')
    
    for epoch in range(epochs):
        print(f"\nEpoch {epoch+1}/{epochs}")
        
        train_loss = trainer.train_epoch(train_loader)
        val_loss, val_acc = trainer.validate(val_loader)
        
        print(f"Train Loss: {train_loss:.4f}")
        print(f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")
        
        trainer.scheduler.step(val_loss)
        
        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            trainer.save_checkpoint(
                f'checkpoints/best_model_epoch_{epoch+1}.pth',
                epoch, val_loss, val_acc
            )
    
    return model

if __name__ == "__main__":
    # Create checkpoints directory
    Path('checkpoints').mkdir(exist_ok=True)
    
    print("=" * 60)
    print("Running Gait Analysis Model Training")
    print("=" * 60)
    print(f"\nDevice: {device}")
    
    # Train model
    # model = train_model('datasets/running_gait', epochs=50, batch_size=8)
    
    print("\nTo train:")
    print("1. Collect datasets using dataset_collector.py")
    print("2. Run: python train_gait_model.py")
