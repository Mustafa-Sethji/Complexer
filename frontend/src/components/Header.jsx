import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="header-logo">
          <Cpu size={22} strokeWidth={2.2} />
        </div>
        <div>
          <h1 className="header-title">Complexity Analyzer</h1>
          <p className="header-subtitle">Deterministic Big-O Static Analysis & Recurrence Solver</p>
        </div>
      </div>

      <div className="header-badges">
        <span className="badge badge-rule">
          <ShieldCheck size={14} className="badge-icon" />
          NITT MCA-A
        </span>
      </div>
    </header>
  );
}
