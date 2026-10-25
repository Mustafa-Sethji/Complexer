import React from 'react';

export default function ModeToggle({ mode, setMode }) {
  return (
    <div className="mode-toggle-container">
      <div className="mode-toggle">
        <button
          type="button"
          className={`mode-btn ${mode === 'cpp' ? 'active' : ''}`}
          onClick={() => setMode('cpp')}
        >
          C++
        </button>
        <button
          type="button"
          className={`mode-btn ${mode === 'pseudocode' ? 'active' : ''}`}
          onClick={() => setMode('pseudocode')}
        >
          Pseudocode
        </button>
      </div>
    </div>
  );
}
