/**
 * Settings Component
 *
 * Displays backend API configuration status
 * API keys are stored securely in backend/.env file (never exposed to frontend)
 */

import React, { useState, useEffect } from 'react';
import { Key, Server, CheckCircle, XCircle, AlertCircle, Shield, ExternalLink, Terminal, FileCode } from 'lucide-react';
import ModelSelector from './ModelSelector';
import FeatureFlagsPanel from './FeatureFlagsPanel';

const Settings = () => {
  const [backendStatus, setBackendStatus] = useState({
    healthy: false,
    loading: true,
    services: {
      anthropic: false,
      openai: false,
      gemini: false
    },
    error: null
  });

  const providers = [
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      model: 'Claude 3.5 Sonnet',
      pricing: '$3 / $15 per 1M tokens',
      getKeyUrl: 'https://console.anthropic.com/',
      description: 'BEST for structured extraction and natural language summaries',
      recommended: true
    },
    {
      id: 'openai',
      name: 'OpenAI',
      model: 'GPT-4o',
      pricing: '$2.50 / $10 per 1M tokens',
      getKeyUrl: 'https://platform.openai.com/api-keys',
      description: 'Excellent medical knowledge and reasoning'
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      model: 'Gemini 1.5 Pro',
      pricing: '$1.25 / $5 per 1M tokens',
      getKeyUrl: 'https://makersuite.google.com/app/apikey',
      description: 'Good performance, most cost-effective'
    }
  ];

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    setBackendStatus(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('http://localhost:3001/api/health');

      if (!response.ok) {
        throw new Error('Backend server not responding');
      }

      const data = await response.json();

      setBackendStatus({
        healthy: data.status === 'healthy',
        loading: false,
        services: data.services || {
          anthropic: false,
          openai: false,
          gemini: false
        },
        error: null
      });
    } catch (error) {
      setBackendStatus({
        healthy: false,
        loading: false,
        services: {
          anthropic: false,
          openai: false,
          gemini: false
        },
        error: error.message
      });
    }
  };

  const hasAnyKey = Object.values(backendStatus.services).some(v => v);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Settings & Configuration</h2>
        </div>
        <p className="text-gray-600">
          Configure AI models, API keys, and view system status.
        </p>
      </div>

      {/* Model Selector - NEW FEATURE */}
      <div className="mb-8">
        <ModelSelector />
      </div>

      {/* Divider */}
      <div className="my-8 border-t-2 border-gray-200"></div>

      {/* API Configuration Section Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Backend API Configuration</h3>
        <p className="text-gray-600 text-sm">
          API keys are stored securely in the backend server. Never exposed to the browser.
        </p>
      </div>

      {/* Backend Status Card */}
      <div className="mb-6 p-6 bg-white border-2 border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Server className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Backend Server Status</h3>
          </div>
          <button
            onClick={checkBackendHealth}
            disabled={backendStatus.loading}
            className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
          >
            {backendStatus.loading ? 'Checking...' : 'Refresh'}
          </button>
        </div>

        {backendStatus.loading ? (
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            <span>Checking backend server...</span>
          </div>
        ) : backendStatus.error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 mb-1">Backend Server Not Running</p>
                <p className="text-sm text-red-800 mb-3">{backendStatus.error}</p>
                <div className="bg-red-100 rounded p-3 text-sm font-mono text-red-900">
                  <p className="mb-1">To start the backend server:</p>
                  <p className="font-bold">cd backend && node server.js</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Backend server is running</span>
            </div>
            <p className="text-sm text-green-700 mt-2">
              Server: http://localhost:3001
            </p>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-blue-900 mb-1">🔒 Secure Architecture</p>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li>API keys stored in <code className="bg-blue-100 px-1 rounded">backend/.env</code> file</li>
              <li>Keys never sent to browser or exposed in network traffic</li>
              <li>Backend proxy server handles all LLM API requests</li>
              <li>Pattern-based extraction works without API keys (~70% accuracy)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* API Provider Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Key className="w-5 h-5" />
          <span>Configured API Providers</span>
        </h3>

        <div className="space-y-3">
          {providers.map(provider => {
            const isConfigured = backendStatus.services[provider.id];

            return (
              <div
                key={provider.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  provider.recommended ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900">{provider.name}</h4>
                    {provider.recommended && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-600 text-white rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{provider.description}</p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>Model: {provider.model}</span>
                    <span>•</span>
                    <span>{provider.pricing}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {backendStatus.healthy && (
                    <div className="flex items-center space-x-2">
                      {isConfigured ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Configured</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-500">Not configured</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuration Instructions */}
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-start space-x-3 mb-4">
          <Terminal className="w-6 h-6 text-gray-700 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Configure API Keys</h3>
            <p className="text-sm text-gray-700 mb-4">
              API keys must be added to the backend server's <code className="bg-gray-200 px-1 rounded">.env</code> file.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">Get API Key</h4>
                <p className="text-sm text-gray-700 mb-2">Choose a provider and create an API key:</p>
                <div className="space-y-1">
                  {providers.map(provider => (
                    <a
                      key={provider.id}
                      href={provider.getKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-sm text-blue-600 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{provider.name} - Get API Key</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">Create .env File</h4>
                <p className="text-sm text-gray-700 mb-2">In the <code className="bg-gray-200 px-1 rounded">backend/</code> directory:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                  <p>cd backend</p>
                  <p>cp .env.example .env</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">Add API Key to .env</h4>
                <p className="text-sm text-gray-700 mb-2">Edit <code className="bg-gray-200 px-1 rounded">backend/.env</code>:</p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                  <p className="text-gray-500"># Add your API key(s)</p>
                  <p className="text-green-400">ANTHROPIC_API_KEY=sk-ant-your-key-here</p>
                  <p className="text-green-400">OPENAI_API_KEY=sk-your-key-here</p>
                  <p className="text-green-400">GEMINI_API_KEY=your-gemini-key-here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 mb-2">Restart Backend Server</h4>
                <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                  <p>cd backend</p>
                  <p>node server.js</p>
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  Then click the "Refresh" button above to verify the configuration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Info */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 Extraction Performance</h4>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li><strong>Without API keys:</strong> Pattern-based extraction (~70% accuracy) - Always works</li>
          <li><strong>With Claude:</strong> 90-98% accuracy - Best for structured extraction</li>
          <li><strong>With GPT-4:</strong> 85-95% accuracy - Excellent medical knowledge</li>
          <li><strong>With Gemini:</strong> 80-90% accuracy - Most cost-effective</li>
          <li><strong>Cost:</strong> ~$0.01-0.05 per discharge summary</li>
        </ul>
      </div>

      {/* Task 4: Feature Flags Panel */}
      <div className="mt-8">
        <FeatureFlagsPanel />
      </div>
    </div>
  );
};

export default Settings;
