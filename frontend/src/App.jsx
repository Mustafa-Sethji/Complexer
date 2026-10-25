import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ModeToggle from './components/ModeToggle';
import CodeEditor from './components/CodeEditor';
import PseudocodeRules from './components/PseudocodeRules';
import ResultCard from './components/ResultCard';
import RecurrenceBlock from './components/RecurrenceBlock';
import ExplanationList from './components/ExplanationList';
import { PRESETS, PRESET_CATEGORIES } from './presets';
import { Play, AlertCircle, Sparkles, RefreshCw, GitBranch } from 'lucide-react';
import './App.css';

export default function App() {
  const [mode, setMode] = useState('cpp');
  const [code, setCode] = useState(PRESETS.cpp[0].code);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [targetFunction, setTargetFunction] = useState(null);

  // Switch initial code when mode changes
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setCode(PRESETS[newMode][0].code);
    setResult(null);
    setError(null);
    setTargetFunction(null);
  };

  const handlePresetSelect = (presetId) => {
    const list = PRESETS[mode];
    const found = list.find((p) => p.id === presetId);
    if (found) {
      setCode(found.code);
      setResult(null);
      setError(null);
      setTargetFunction(null);
    }
  };

  const analyze = async (targetFn = targetFunction) => {
    if (!code || !code.trim()) {
      setError('Please enter some code to analyze.');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, mode, targetFunction: targetFn })
      };
      const response = await fetch('/api/analyze', payload);

      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); } catch (_) {
        throw new Error(`Server replied HTTP ${response.status} without a valid answer. This means an OLD dev server is still running: press Ctrl+C in every terminal, then run "npm start" in the project root.`);
      }

      if (!data.success) {
        setError(data.error || 'Analysis failed.');
        setResult(null);
      } else {
        setResult(data);
        setTargetFunction(data.selectedFunction);
        setError(null);
      }
    } catch (err) {
      const detail = err && err.message ? err.message : 'Unknown network error';
      setError(
        `Could not reach the analyzer API at http://127.0.0.1:4000. ` +
        `Make sure the backend is running and restart the app with \"npm start\" from the project root. Details: ${detail}`
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFunctionChange = (fnName) => {
    setTargetFunction(fnName);
    analyze(fnName);
  };

  // Keyboard shortcut: Cmd/Ctrl + Enter to trigger analysis
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        analyze();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, mode, targetFunction]);

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        {/* LEFT COLUMN: Input & Code */}
        <section className="column column-left">
          <div className="panel-top-controls">
            <ModeToggle mode={mode} setMode={handleModeChange} />

            <div className="preset-selector">
              <label htmlFor="preset-select" className="preset-label">Templates:</label>
              <select
                id="preset-select"
                className="preset-dropdown"
                onChange={(e) => handlePresetSelect(e.target.value)}
                defaultValue={PRESETS[mode][0].id}
              >
                {PRESET_CATEGORIES.map((category) => {
                  const items = PRESETS[mode].filter((p) => p.category === category);
                  if (items.length === 0) return null;
                  return (
                    <optgroup key={category} label={category}>
                      {items.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
          </div>

          <CodeEditor
            value={code}
            onChange={(val) => {
              setCode(val);
              setTargetFunction(null);
            }}
            mode={mode}
          />

          {mode === 'pseudocode' && (
            <PseudocodeRules onLoadExample={(ex) => setCode(ex)} />
          )}
        </section>

        {/* RIGHT COLUMN: Action & Results */}
        <section className="column column-right">
          <div className="action-bar">
            <button
              type="button"
              className="analyze-btn"
              onClick={() => analyze()}
              disabled={loading}
              id="analyze-button"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="btn-spinner" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  <span>Analyze Complexity</span>
                </>
              )}
            </button>
            <span className="shortcut-hint">Press ⌘+Enter</span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={18} className="error-icon" />
              <div className="error-content">
                <strong>Analysis Diagnostic:</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Results State */}
          {result && (
            <div className="results-wrapper">
              {result.functions && result.functions.length > 1 && (
                <div className="function-selector-bar">
                  <div className="function-selector-left">
                    <GitBranch size={16} className="function-icon" />
                    <span className="function-selector-label">Analyzed Function:</span>
                  </div>
                  <select
                    id="function-select"
                    className="function-selector-dropdown"
                    value={targetFunction || result.selectedFunction}
                    onChange={(e) => handleFunctionChange(e.target.value)}
                  >
                    {result.functions.map((fn) => (
                      <option key={fn} value={fn}>
                        {fn}()
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="result-cards-grid">
                <ResultCard
                  type="time"
                  value={result.timeComplexity}
                  subtitle={result.isRecursive ? 'Recurrence closed-form' : 'Static loop/step analysis'}
                />
                <ResultCard
                  type="space"
                  value={result.spaceComplexity}
                  subtitle={result.isRecursive ? 'Call stack depth + frames' : 'Auxiliary allocation only'}
                />
              </div>

              {/* Recurrence Block */}
              {result.isRecursive && result.recurrence && (
                <RecurrenceBlock data={result.recurrence} />
              )}

              {/* Step-by-Step Explanation List */}
              <ExplanationList explanations={result.explanations} />
            </div>
          )}

          {/* Initial / Empty State */}
          {!result && !error && (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <Sparkles size={28} />
              </div>
              <h3>Ready to analyze</h3>
              <p>
                Choose an algorithm template or paste your code on the left, then click <strong>Analyze Complexity</strong>.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
