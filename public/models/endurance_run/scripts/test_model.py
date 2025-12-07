"""
Test trained model on sample videos
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from backend.gait_analyzer_enhanced import EnhancedGaitAnalyzer
import json
import time

def test_model(video_path, model_path=None):
    """Test model on a single video"""
    print(f"\n{'='*70}")
    print(f"Testing: {video_path}")
    print(f"{'='*70}")
    
    # Initialize analyzer
    analyzer = EnhancedGaitAnalyzer(model_path=model_path, use_gpu=True)
    
    # Analyze video
    start_time = time.time()
    results = analyzer.analyze_video(video_path)
    elapsed = time.time() - start_time
    
    if "error" in results:
        print(f"\n✗ Error: {results['error']}")
        return
    
    # Display results
    print(f"\n⏱️  Analysis time: {elapsed:.2f}s")
    print(f"\n📊 METRICS:")
    for metric, value in results['metrics'].items():
        print(f"  {metric}: {value}")
    
    print(f"\n✅ PERFORMANCE:")
    print(f"  Cadence: {results['performance']['cadence']} spm")
    print(f"  Ground Contact: {results['performance']['ground_contact_time']} ms")
    print(f"  Vertical Oscillation: {results['performance']['vertical_oscillation']}")
    print(f"  Symmetry: {results['performance']['symmetry']}%")
    print(f"  Foot Strike: {results['performance']['foot_strike']}")
    
    print(f"\n💡 IMPROVEMENTS:")
    for imp in results['improvements']:
        print(f"  • {imp}")
    
    print(f"\n🎯 CONFIDENCE:")
    conf = results['technical']['confidence']
    print(f"  Overall: {conf['overall']}%")
    print(f"  {conf['explanation']}")
    
    # Save detailed results
    output_path = Path(video_path).stem + "_analysis.json"
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n💾 Detailed results saved to: {output_path}")

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Test gait analysis model")
    parser.add_argument("video", help="Path to video file")
    parser.add_argument("--model", help="Path to trained model checkpoint", default=None)
    
    args = parser.parse_args()
    
    if not Path(args.video).exists():
        print(f"Error: Video file not found: {args.video}")
        return
    
    model_path = args.model
    if model_path is None:
        default_path = Path("checkpoints/best_model.pth")
        if default_path.exists():
            model_path = str(default_path)
            print(f"Using default model: {model_path}")
    
    test_model(args.video, model_path)

if __name__ == "__main__":
    main()
