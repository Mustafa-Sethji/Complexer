import React from 'react';
import { GitBranch, ArrowRight } from 'lucide-react';

export default function RecurrenceBlock({ data }) {
  if (!data) return null;

  const { recurrenceString, method, solvedResult, explanation } = data;

  return (
    <div className="recurrence-card">
      <div className="recurrence-header">
        <GitBranch size={16} className="recurrence-icon" />
        <span className="recurrence-title">Recursive Recurrence Analysis</span>
      </div>

      <div className="recurrence-flow">
        <div className="flow-step flow-eq">
          <span className="step-label">Recurrence</span>
          <code className="step-val">{recurrenceString}</code>
        </div>

        <ArrowRight size={16} className="flow-arrow" />

        <div className="flow-step flow-method">
          <span className="step-label">Method Applied</span>
          <span className="step-val method-name">{method}</span>
        </div>

        <ArrowRight size={16} className="flow-arrow" />

        <div className="flow-step flow-result">
          <span className="step-label">Solved Big-O</span>
          <code className="step-val result-badge">{solvedResult}</code>
        </div>
      </div>

      {explanation && (
        <div className="recurrence-explanation">
          <p>{explanation}</p>
        </div>
      )}
    </div>
  );
}
