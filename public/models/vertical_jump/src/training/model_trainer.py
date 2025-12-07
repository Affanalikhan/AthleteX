"""
ML Model Trainer for Vertical Jump Analysis
Trains LSTM model on jump video dataset
"""
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import numpy as np
from typing import List, Tuple, Dict
import os
import json
from tqdm import tqdm


class JumpLSTMModel(nn.Module):
    """
    LSTM-based temporal model for jump analysis
    Predicts jump metrics and classifies errors
    """
    
    def __init__(self, input_size=11, hidden_size=128, num_layers=2):
        super(JumpLSTMModel, self).__init__()
        
        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2
        )
        
        # Regression head (for continuous metrics)
        self.regression_head = nn.Sequential(
            nn.Linear(hidden_size, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 4)  # jump_height, quality_score, velocity, timing
        )
        
        # Classification head (for error detection)
        self.classification_head = nn.Sequential(
            nn.Linear(hidden_size, 64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 5)  # 5 error types
        )
        
    def forward(self, x):
        # x shape: (batch, sequence_length, features)
        lstm_out, (hidden, cell) = self.lstm(x)
        
        # Use last hidden state
        last_hidden = hidden[-1]
        
        # Predictions
        regression_output = self.regression_head(last_hidden)
        classification_output = self.classification_head(last_hidden)
        
        return regression_output, classification_output


class JumpDataset(Dataset):
    """Dataset for jump videos with features and labels"""
    
    def __init__(self, features_list: List[np.ndarray], labels_list: List[Dict]):
        self.features = features_list
        self.labels = labels_list
        
    def __len__(self):
        return len(self.features)
    
    def __getitem__(self, idx):
        features = torch.FloatTensor(self.features[idx])
        
        # Extract labels
        label = self.labels[idx]
        regression_target = torch.FloatTensor([
            label['jump_height'],
            label['quality_score'],
            label['velocity'],
            label['timing']
        ])
        
        classification_target = torch.FloatTensor(label['errors'])  # One-hot encoded
        
        return features, regression_target, classification_target


class ModelTrainer:
    """Trains the jump analysis model"""
    
    def __init__(self, model: JumpLSTMModel, device='cuda' if torch.cuda.is_available() else 'cpu'):
        self.model = model.to(device)
        self.device = device
        
        # Loss functions
        self.regression_loss = nn.MSELoss()
        self.classification_loss = nn.BCEWithLogitsLoss()
        
        # Optimizer
        self.optimizer = optim.Adam(model.parameters(), lr=0.001)
        self.scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            self.optimizer, mode='min', patience=5, factor=0.5
        )
        
        # Training history
        self.history = {
            'train_loss': [],
            'val_loss': [],
            'train_mae': [],
            'val_mae': []
        }
        
    def train_epoch(self, train_loader: DataLoader) -> Tuple[float, float]:
        """Train for one epoch"""
        self.model.train()
        total_loss = 0
        total_mae = 0
        num_batches = 0
        
        for features, reg_targets, class_targets in tqdm(train_loader, desc="Training"):
            features = features.to(self.device)
            reg_targets = reg_targets.to(self.device)
            class_targets = class_targets.to(self.device)
            
            # Forward pass
            reg_output, class_output = self.model(features)
            
            # Calculate losses
            reg_loss = self.regression_loss(reg_output, reg_targets)
            class_loss = self.classification_loss(class_output, class_targets)
            
            # Combined loss
            loss = reg_loss + 0.5 * class_loss
            
            # Backward pass
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()
            
            # Track metrics
            total_loss += loss.item()
            total_mae += torch.mean(torch.abs(reg_output - reg_targets)).item()
            num_batches += 1
        
        avg_loss = total_loss / num_batches
        avg_mae = total_mae / num_batches
        
        return avg_loss, avg_mae
    
    def validate(self, val_loader: DataLoader) -> Tuple[float, float]:
        """Validate the model"""
        self.model.eval()
        total_loss = 0
        total_mae = 0
        num_batches = 0
        
        with torch.no_grad():
            for features, reg_targets, class_targets in val_loader:
                features = features.to(self.device)
                reg_targets = reg_targets.to(self.device)
                class_targets = class_targets.to(self.device)
                
                # Forward pass
                reg_output, class_output = self.model(features)
                
                # Calculate losses
                reg_loss = self.regression_loss(reg_output, reg_targets)
                class_loss = self.classification_loss(class_output, class_targets)
                loss = reg_loss + 0.5 * class_loss
                
                # Track metrics
                total_loss += loss.item()
                total_mae += torch.mean(torch.abs(reg_output - reg_targets)).item()
                num_batches += 1
        
        avg_loss = total_loss / num_batches
        avg_mae = total_mae / num_batches
        
        return avg_loss, avg_mae
    
    def train(self, train_loader: DataLoader, val_loader: DataLoader, 
              num_epochs: int = 50, save_path: str = 'models/jump_model.pth'):
        """
        Train the model
        
        Args:
            train_loader: Training data loader
            val_loader: Validation data loader
            num_epochs: Number of training epochs
            save_path: Path to save best model
        """
        print(f"🚀 Starting training on {self.device}")
        print(f"   Epochs: {num_epochs}")
        print(f"   Model parameters: {sum(p.numel() for p in self.model.parameters()):,}")
        
        best_val_loss = float('inf')
        patience_counter = 0
        max_patience = 10
        
        for epoch in range(num_epochs):
            print(f"\nEpoch {epoch+1}/{num_epochs}")
            
            # Train
            train_loss, train_mae = self.train_epoch(train_loader)
            
            # Validate
            val_loss, val_mae = self.validate(val_loader)
            
            # Update learning rate
            self.scheduler.step(val_loss)
            
            # Save history
            self.history['train_loss'].append(train_loss)
            self.history['val_loss'].append(val_loss)
            self.history['train_mae'].append(train_mae)
            self.history['val_mae'].append(val_mae)
            
            # Print metrics
            print(f"   Train Loss: {train_loss:.4f}, MAE: {train_mae:.4f}")
            print(f"   Val Loss: {val_loss:.4f}, MAE: {val_mae:.4f}")
            
            # Save best model
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                patience_counter = 0
                
                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                torch.save({
                    'epoch': epoch,
                    'model_state_dict': self.model.state_dict(),
                    'optimizer_state_dict': self.optimizer.state_dict(),
                    'val_loss': val_loss,
                    'val_mae': val_mae
                }, save_path)
                
                print(f"   ✅ Best model saved! (Val Loss: {val_loss:.4f})")
            else:
                patience_counter += 1
                
            # Early stopping
            if patience_counter >= max_patience:
                print(f"\n⏹️  Early stopping triggered after {epoch+1} epochs")
                break
        
        print(f"\n🎉 Training complete!")
        print(f"   Best validation loss: {best_val_loss:.4f}")
        print(f"   Model saved to: {save_path}")
        
        return self.history
    
    def save_history(self, path: str = 'models/training_history.json'):
        """Save training history"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f:
            json.dump(self.history, f, indent=2)
        print(f"📊 Training history saved to: {path}")


# Example usage
if __name__ == "__main__":
    print("🏀 Vertical Jump Coach - Model Trainer")
    print("=" * 60)
    
    # Create model
    model = JumpLSTMModel(input_size=11, hidden_size=128, num_layers=2)
    print(f"✅ Model created")
    print(f"   Parameters: {sum(p.numel() for p in model.parameters()):,}")
    
    # Create sample data for testing
    print("\n📝 Creating sample training data...")
    sample_features = [np.random.randn(60, 11) for _ in range(100)]  # 100 samples
    sample_labels = [
        {
            'jump_height': np.random.uniform(20, 80),
            'quality_score': np.random.uniform(50, 100),
            'velocity': np.random.uniform(1, 4),
            'timing': np.random.uniform(0.5, 2.0),
            'errors': np.random.randint(0, 2, 5).astype(float)
        }
        for _ in range(100)
    ]
    
    # Create dataset and loader
    dataset = JumpDataset(sample_features, sample_labels)
    train_loader = DataLoader(dataset, batch_size=16, shuffle=True)
    val_loader = DataLoader(dataset, batch_size=16, shuffle=False)
    
    print(f"✅ Dataset created: {len(dataset)} samples")
    
    # Train model
    trainer = ModelTrainer(model)
    print("\n🚀 Starting training...")
    print("   (This is a demo with random data)")
    print("   For real training, use Roboflow dataset")
    
    # Uncomment to train:
    # history = trainer.train(train_loader, val_loader, num_epochs=5)
    # trainer.save_history()
    
    print("\n✅ Trainer ready!")
    print("\n📝 Next steps:")
    print("   1. Get dataset from Roboflow")
    print("   2. Process videos to extract features")
    print("   3. Run trainer.train() with real data")
    print("   4. Model will be saved to models/jump_model.pth")
