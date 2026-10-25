import React from 'react';
import { Clock, HardDrive } from 'lucide-react';

export default function ResultCard({ type, value, subtitle }) {
  const isTime = type === 'time';
  const Icon = isTime ? Clock : HardDrive;
  const label = isTime ? 'Time Complexity' : 'Auxiliary Space Complexity';

  return (
    <div className={`result-card ${isTime ? 'result-card-time' : 'result-card-space'}`}>
      <div className="card-top">
        <span className="card-icon-wrapper">
          <Icon size={16} />
        </span>
        <span className="card-label">{label}</span>
      </div>

      <div className="card-value-wrapper">
        <span className="big-o-badge">{value || '—'}</span>
      </div>

      {subtitle && <p className="card-subtitle">{subtitle}</p>}
    </div>
  );
}
