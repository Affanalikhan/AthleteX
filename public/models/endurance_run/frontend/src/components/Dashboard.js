import React from 'react';
import './Dashboard.css';

function Dashboard({ data, onReset }) {
  const { metrics, performance, improvements, exercises, technical } = data;

  return (
    <div className="dashboard">
      <button onClick={onReset} className="reset-btn">← Analyze Another Video</button>

      <section className="metric-tiles">
        <MetricTile 
          title="Endurance Score" 
          value={metrics.endurance_score} 
          subtitle="Stride consistency & energy efficiency"
        />
        <MetricTile 
          title="Running Efficiency" 
          value={metrics.efficiency} 
          subtitle="Form optimization score"
        />
        <MetricTile 
          title="Cadence Score" 
          value={metrics.cadence_score} 
          subtitle="Step rate optimization"
        />
        <MetricTile 
          title="Impact Control" 
          value={metrics.impact_control} 
          subtitle="Ground contact management"
        />
        <MetricTile 
          title="Symmetry Score" 
          value={metrics.symmetry_score} 
          subtitle="Left-right balance"
        />
        <MetricTile 
          title="Fatigue Resistance" 
          value={metrics.fatigue_resistance} 
          subtitle="Form stability over time"
        />
      </section>

      <section className="performance-section">
        <h2>✅ Your Performance</h2>
        <div className="performance-stats">
          <p><strong>Cadence:</strong> {performance.cadence} spm</p>
          <p><strong>Efficiency:</strong> {metrics.efficiency}%</p>
          <p><strong>Foot Strike:</strong> {performance.foot_strike}</p>
          <p><strong>Symmetry:</strong> {performance.symmetry}%</p>
        </div>
        <ul className="highlights">
          {performance.highlights.map((h, i) => (
            <li key={i}>✅ {h}</li>
          ))}
        </ul>
      </section>

      <section className="improvements-section">
        <h2>💡 Areas for Improvement</h2>
        <ul>
          {improvements.map((imp, i) => (
            <li key={i}>{imp}</li>
          ))}
        </ul>
      </section>

      <section className="exercises-section">
        <h2>🏋️ Recommended Exercises</h2>
        <div className="exercise-cards">
          {exercises.map((ex, i) => (
            <ExerciseCard key={i} exercise={ex} />
          ))}
        </div>
      </section>

      <section className="technical-section">
        <h2>🔍 Technical Details</h2>
        <div className="technical-grid">
          <div>
            <h3>Phase Timing</h3>
            <p>Contact: {technical.phase_timing.contact} ms</p>
            <p>Toe-off: {technical.phase_timing.toe_off} ms</p>
            <p>Swing: {technical.phase_timing.swing} ms</p>
          </div>
          <div>
            <h3>Joint Angles</h3>
            <p>Knee flexion: {technical.joint_angles.knee_flexion}°</p>
            <p>Hip extension: {technical.joint_angles.hip_extension}°</p>
            <p>Trunk lean: {technical.joint_angles.trunk_lean}°</p>
          </div>
          <div>
            <h3>Gait Metrics</h3>
            <p>Cadence: {technical.gait_metrics.cadence} spm</p>
            <p>Symmetry: {technical.gait_metrics.symmetry}%</p>
            <p>Vertical oscillation: {technical.gait_metrics.vertical_oscillation}</p>
          </div>
        </div>
        <p className="confidence">
          <strong>Confidence:</strong> {technical.confidence}% 
          <span className="confidence-note"> – High confidence, full body visible throughout multiple stride cycles</span>
        </p>
      </section>
    </div>
  );
}

function MetricTile({ title, value, subtitle }) {
  return (
    <div className="metric-tile">
      <div className="metric-value">{value}</div>
      <div className="metric-title">{title}</div>
      <div className="metric-subtitle">{subtitle}</div>
    </div>
  );
}

function ExerciseCard({ exercise }) {
  return (
    <div className="exercise-card">
      <h3>{exercise.name}</h3>
      <p><strong>Target:</strong> {exercise.target}</p>
      <p><strong>How:</strong> {exercise.how}</p>
      <span className={`difficulty ${exercise.difficulty.toLowerCase()}`}>
        {exercise.difficulty}
      </span>
    </div>
  );
}

export default Dashboard;
