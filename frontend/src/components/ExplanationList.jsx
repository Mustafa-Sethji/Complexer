import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ListTree } from 'lucide-react';

export default function ExplanationList({ explanations = [] }) {
  const [isOpen, setIsOpen] = useState(true);

  if (!explanations || explanations.length === 0) return null;

  return (
    <div className="explanation-section">
      <button
        type="button"
        className="explanation-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="toggle-left">
          <ListTree size={16} />
          <span>Step-by-Step Static Analysis Trace</span>
          <span className="count-badge">{explanations.length}</span>
        </div>
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isOpen && (
        <div className="explanation-list">
          {explanations.map((item, idx) => (
            <div key={idx} className="explanation-item">
              <div className="item-meta">
                <span className="line-tag">
                  {typeof item.line === 'number' ? `Line ${item.line}` : `${item.line}`}
                </span>
                <span className="rule-name">{item.rule}</span>
                {item.complexity && (
                  <span className="item-complexity">{item.complexity}</span>
                )}
              </div>
              <p className="item-details">{item.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
