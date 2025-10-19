import React, { useState, useEffect } from 'react';
import { PREMIUM_MODELS, getSelectedModel, setSelectedModel, getCostTracking, getPerformanceMetrics } from '../services/llmService';

/**
 * Model Selector Component
 * 
 * Allows users to:
 * - Select between different LLM models (Claude, GPT, Gemini)
 * - View cost and performance metrics
 * - Configure API keys
 * - See model capabilities and pricing
 */
export default function ModelSelector() {
  const [selectedModelId, setSelectedModelId] = useState('claude-sonnet-3.5');
  const [costTracking, setCostTracking] = useState(null);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    // Load saved model selection
    const current = getSelectedModel();
    setSelectedModelId(current.id);

    // Load metrics
    loadMetrics();
  }, []);

  const loadMetrics = () => {
    setCostTracking(getCostTracking());
    setPerformanceMetrics(getPerformanceMetrics());
  };

  const handleModelChange = (modelId) => {
    if (setSelectedModel(modelId)) {
      setSelectedModelId(modelId);
      alert(`✅ Switched to ${PREMIUM_MODELS[modelId].name}`);
    }
  };

  const getModelStatus = (provider) => {
    // API keys are now managed on backend - always show as ready if backend is available
    // Backend availability is checked when making actual API calls
    return '✅ Backend Managed';
  };

  const groupedModels = {
    'Anthropic Claude': Object.values(PREMIUM_MODELS).filter(m => m.provider === 'anthropic'),
    'Google Gemini': Object.values(PREMIUM_MODELS).filter(m => m.provider === 'google'),
    'OpenAI GPT': Object.values(PREMIUM_MODELS).filter(m => m.provider === 'openai')
  };

  return (
    <div className="model-selector-container">
      <div className="section-header">
        <h3>🤖 AI Model Selection</h3>
        <p className="section-description">
          Choose your preferred AI model for generating discharge summaries. 
          Each model has different strengths, speeds, and costs.
        </p>
      </div>

      {/* Model Selection Grid */}
      {Object.entries(groupedModels).map(([providerName, models]) => (
        <div key={providerName} className="model-group">
          <h4 className="provider-name">{providerName}</h4>
          <div className="model-grid">
            {models.map((model) => (
              <div
                key={model.id}
                className={`model-card ${selectedModelId === model.id ? 'selected' : ''} ${model.recommended ? 'recommended' : ''}`}
                onClick={() => handleModelChange(model.id)}
              >
                {model.recommended && (
                  <div className="recommended-badge">⭐ Recommended</div>
                )}
                
                <div className="model-header">
                  <h5>{model.name}</h5>
                  <span className={`status-badge ${getModelStatus(model.provider).includes('Ready') ? 'ready' : 'not-ready'}`}>
                    {getModelStatus(model.provider)}
                  </span>
                </div>

                <p className="model-description">{model.description}</p>

                <div className="model-specs">
                  <div className="spec">
                    <span className="spec-label">Speed:</span>
                    <span className="spec-value">{model.speed}</span>
                  </div>
                  <div className="spec">
                    <span className="spec-label">Quality:</span>
                    <span className="spec-value">{model.quality}</span>
                  </div>
                  <div className="spec">
                    <span className="spec-label">Context:</span>
                    <span className="spec-value">{(model.contextWindow / 1000).toFixed(0)}K tokens</span>
                  </div>
                </div>

                <div className="model-pricing">
                  <div className="price-row">
                    <span>Input:</span>
                    <span>${model.costPer1MInput}/1M tokens</span>
                  </div>
                  <div className="price-row">
                    <span>Output:</span>
                    <span>${model.costPer1MOutput}/1M tokens</span>
                  </div>
                </div>

                {selectedModelId === model.id && (
                  <div className="selected-indicator">
                    ✓ Currently Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Cost Tracking */}
      {costTracking && (
        <div className="metrics-section">
          <button 
            className="toggle-btn"
            onClick={() => setShowMetrics(!showMetrics)}
          >
            {showMetrics ? '📊 Hide' : '📊 Show'} Usage Statistics
          </button>

          {showMetrics && (
            <div className="metrics-content">
              <div className="cost-summary">
                <h4>💰 Cost Summary</h4>
                <div className="cost-grid">
                  <div className="cost-item total">
                    <span className="cost-label">Total Cost</span>
                    <span className="cost-value">${costTracking.totalCost.toFixed(4)}</span>
                  </div>
                  
                  {Object.entries(costTracking.byProvider || {}).map(([provider, data]) => (
                    <div key={provider} className="cost-item">
                      <span className="cost-label">{provider}</span>
                      <div className="cost-details">
                        <span>${data.cost.toFixed(4)}</span>
                        <span className="cost-meta">{data.calls} calls, {(data.tokens / 1000).toFixed(1)}K tokens</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {performanceMetrics && (
                <div className="performance-summary">
                  <h4>⚡ Performance Metrics</h4>
                  <div className="metrics-grid">
                    {Object.entries(performanceMetrics.byProvider || {}).map(([provider, metrics]) => (
                      <div key={provider} className="metric-card">
                        <h5>{provider}</h5>
                        <div className="metric-row">
                          <span>Avg Duration:</span>
                          <span>{metrics.avgDuration.toFixed(0)}ms</span>
                        </div>
                        <div className="metric-row">
                          <span>Avg Cost:</span>
                          <span>${metrics.avgCost.toFixed(4)}</span>
                        </div>
                        <div className="metric-row">
                          <span>Success Rate:</span>
                          <span className={metrics.successRate > 90 ? 'success' : 'warning'}>
                            {metrics.successRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="metric-row">
                          <span>Total Calls:</span>
                          <span>{metrics.totalCalls}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                className="refresh-btn"
                onClick={loadMetrics}
              >
                🔄 Refresh Metrics
              </button>
            </div>
          )}
        </div>
      )}

      {/* API Configuration Help */}
      <div className="api-help-section">
        <h4>🔑 API Configuration</h4>
        <p>To use these models, you need valid API keys. The keys are configured in your backend server.</p>
        <div className="api-links">
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="api-link">
            <span>🔹</span> Get Anthropic API Key
          </a>
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="api-link">
            <span>🔹</span> Get OpenAI API Key
          </a>
          <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="api-link">
            <span>🔹</span> Get Google Gemini API Key
          </a>
        </div>
      </div>

      <style>{`
        .model-selector-container {
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .section-header {
          margin-bottom: 30px;
        }

        .section-header h3 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 24px;
        }

        .section-description {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .model-group {
          margin-bottom: 32px;
        }

        .provider-name {
          margin: 0 0 16px 0;
          color: #374151;
          font-size: 18px;
          font-weight: 600;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }

        .model-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .model-card {
          position: relative;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .model-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
          transform: translateY(-2px);
        }

        .model-card.selected {
          border-color: #10b981;
          background: #f0fdf4;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .model-card.recommended {
          border-color: #f59e0b;
        }

        .recommended-badge {
          position: absolute;
          top: -10px;
          right: 12px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);
        }

        .model-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .model-header h5 {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 600;
        }

        .status-badge {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 600;
        }

        .status-badge.ready {
          background: #d1fae5;
          color: #059669;
        }

        .status-badge.not-ready {
          background: #fef3c7;
          color: #d97706;
        }

        .model-description {
          color: #6b7280;
          font-size: 13px;
          margin: 0 0 16px 0;
          line-height: 1.5;
        }

        .model-specs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .spec {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .spec-label {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          font-weight: 600;
        }

        .spec-value {
          font-size: 13px;
          color: #374151;
          font-weight: 600;
        }

        .model-pricing {
          padding: 12px;
          background: #f3f4f6;
          border-radius: 8px;
          font-size: 12px;
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          color: #4b5563;
        }

        .price-row:last-child {
          margin-bottom: 0;
        }

        .selected-indicator {
          margin-top: 12px;
          padding: 8px;
          background: #10b981;
          color: white;
          text-align: center;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13px;
        }

        .metrics-section {
          margin-top: 32px;
          padding-top: 32px;
          border-top: 2px solid #e5e7eb;
        }

        .toggle-btn {
          width: 100%;
          padding: 12px 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
        }

        .metrics-content {
          margin-top: 20px;
        }

        .cost-summary, .performance-summary {
          margin-bottom: 24px;
        }

        .cost-summary h4, .performance-summary h4 {
          margin: 0 0 16px 0;
          color: #374151;
          font-size: 16px;
        }

        .cost-grid {
          display: grid;
          gap: 12px;
        }

        .cost-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }

        .cost-item.total {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-left-color: #2563eb;
          font-weight: 600;
        }

        .cost-label {
          color: #6b7280;
          font-size: 14px;
        }

        .cost-value {
          color: #1f2937;
          font-size: 18px;
          font-weight: 700;
        }

        .cost-details {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .cost-meta {
          font-size: 11px;
          color: #9ca3af;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }

        .metric-card {
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .metric-card h5 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .metric-row:last-child {
          margin-bottom: 0;
        }

        .metric-row .success {
          color: #10b981;
          font-weight: 600;
        }

        .metric-row .warning {
          color: #f59e0b;
          font-weight: 600;
        }

        .refresh-btn {
          margin-top: 16px;
          padding: 10px 20px;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: #e5e7eb;
        }

        .api-help-section {
          margin-top: 32px;
          padding: 20px;
          background: #eff6ff;
          border-radius: 8px;
          border: 1px solid #bfdbfe;
        }

        .api-help-section h4 {
          margin: 0 0 12px 0;
          color: #1e40af;
          font-size: 16px;
        }

        .api-help-section p {
          margin: 0 0 16px 0;
          color: #1e40af;
          font-size: 14px;
        }

        .api-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .api-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: white;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          color: #2563eb;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .api-link:hover {
          background: #dbeafe;
          border-color: #93c5fd;
          transform: translateX(4px);
        }

        .api-link span {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
}
