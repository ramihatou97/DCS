/**
 * Settings Component
 * 
 * Manages API keys for LLM providers (OpenAI, Anthropic, Gemini)
 * Stores keys securely in localStorage with base64 encoding
 */

import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, DollarSign, Zap, Settings as SettingsIcon } from 'lucide-react';
import { storeApiKey, getApiKey, hasApiKey, removeApiKey, clearAllApiKeys } from '../utils/apiKeys.js';
import { testApiKey, getAvailableProviders } from '../services/llmService.js';
import { getPreferences, setPreferredProvider, setTaskProvider, setAutoSelectByTask } from '../utils/llmPreferences.js';

const Settings = () => {
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    gemini: ''
  });

  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    gemini: false
  });

  const [testResults, setTestResults] = useState({
    openai: null,
    anthropic: null,
    gemini: null
  });

  const [isTesting, setIsTesting] = useState({
    openai: false,
    anthropic: false,
    gemini: false
  });

  const [preferences, setPreferences] = useState({
    preferredProvider: null,
    extractionProvider: null,
    summarizationProvider: null,
    autoSelectByTask: true
  });

  const providers = [
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      model: 'Claude 3.5 Sonnet',
      pricing: '$3 / $15 per 1M tokens',
      getKeyUrl: 'https://console.anthropic.com/',
      description: 'BEST for structured extraction and natural language summaries',
      priority: 1,
      recommended: true
    },
    {
      id: 'openai',
      name: 'OpenAI',
      model: 'GPT-4o / GPT-4',
      pricing: '$2.50 / $10 per 1M tokens',
      getKeyUrl: 'https://platform.openai.com/api-keys',
      description: 'Excellent medical knowledge and reasoning',
      priority: 2
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      model: 'Gemini 1.5 Pro',
      pricing: '$1.25 / $5 per 1M tokens',
      getKeyUrl: 'https://makersuite.google.com/app/apikey',
      description: 'Good performance, most cost-effective',
      priority: 3
    }
  ];

  // Load existing keys and preferences on mount
  useEffect(() => {
    const loadedKeys = {};
    providers.forEach(provider => {
      if (hasApiKey(provider.id)) {
        const key = getApiKey(provider.id);
        loadedKeys[provider.id] = key || '';
      }
    });
    setApiKeys(prev => ({ ...prev, ...loadedKeys }));
    
    // Load preferences
    const prefs = getPreferences();
    setPreferences(prefs);
  }, []);

  const handleKeyChange = (provider, value) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
    // Clear test result when key changes
    setTestResults(prev => ({
      ...prev,
      [provider]: null
    }));
  };

  const handleSaveKey = async (provider) => {
    const key = apiKeys[provider].trim();
    if (!key) {
      alert('Please enter an API key');
      return;
    }

    try {
      storeApiKey(provider, key);
      alert(`${providers.find(p => p.id === provider).name} API key saved successfully!`);
      setTestResults(prev => ({
        ...prev,
        [provider]: { success: true, message: 'Saved (not tested)' }
      }));
    } catch (error) {
      alert(`Failed to save API key: ${error.message}`);
    }
  };

  const handleTestKey = async (provider) => {
    const key = apiKeys[provider].trim();
    if (!key) {
      alert('Please enter an API key first');
      return;
    }

    setIsTesting(prev => ({ ...prev, [provider]: true }));
    setTestResults(prev => ({ ...prev, [provider]: null }));

    try {
      // Save key before testing
      storeApiKey(provider, key);
      
      // Test the key
      const result = await testApiKey(provider);
      
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: result.success,
          message: result.success ? 'API key is valid!' : result.error
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          success: false,
          message: error.message || 'Test failed'
        }
      }));
    } finally {
      setIsTesting(prev => ({ ...prev, [provider]: false }));
    }
  };

  const handleClearKey = (provider) => {
    if (confirm(`Clear ${providers.find(p => p.id === provider).name} API key?`)) {
      removeApiKey(provider);
      setApiKeys(prev => ({ ...prev, [provider]: '' }));
      setTestResults(prev => ({ ...prev, [provider]: null }));
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all API keys? This cannot be undone.')) {
      clearAllApiKeys();
      setApiKeys({ openai: '', anthropic: '', gemini: '' });
      setTestResults({ openai: null, anthropic: null, gemini: null });
    }
  };

  const toggleShowKey = (provider) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const maskKey = (key) => {
    if (!key || key.length < 8) return key;
    return '•'.repeat(key.length - 4) + key.slice(-4);
  };

  const handlePreferredProviderChange = (provider) => {
    setPreferredProvider(provider === 'auto' ? null : provider);
    setPreferences(prev => ({ ...prev, preferredProvider: provider === 'auto' ? null : provider }));
  };

  const handleExtractionProviderChange = (provider) => {
    setTaskProvider('extraction', provider === 'auto' ? null : provider);
    setPreferences(prev => ({ ...prev, extractionProvider: provider === 'auto' ? null : provider }));
  };

  const handleSummarizationProviderChange = (provider) => {
    setTaskProvider('summarization', provider === 'auto' ? null : provider);
    setPreferences(prev => ({ ...prev, summarizationProvider: provider === 'auto' ? null : provider }));
  };

  const handleAutoSelectChange = (enabled) => {
    setAutoSelectByTask(enabled);
    setPreferences(prev => ({ ...prev, autoSelectByTask: enabled }));
  };

  const getAvailableProvidersWithKeys = () => {
    return providers.filter(p => hasApiKey(p.id));
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Key className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">API Settings</h2>
        </div>
        <p className="text-gray-600">
          Configure LLM provider API keys for enhanced extraction and summarization.
          Your keys are stored locally and never sent to our servers.
        </p>
      </div>

      {/* Info Alert */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-blue-900 mb-1">Provider Priority:</p>
            <ul className="list-disc list-inside text-blue-800 space-y-1">
              <li><strong>Claude Sonnet 3.5</strong> - BEST for structured extraction and natural language summaries</li>
              <li><strong>GPT-4o</strong> - Excellent medical knowledge and reasoning</li>
              <li><strong>Gemini Pro</strong> - Good performance, most cost-effective</li>
              <li>Cost per note: approximately $0.01-0.05 depending on length and provider</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Provider Selection */}
      {getAvailableProvidersWithKeys().length > 0 && (
        <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Provider Selection</h3>
          </div>
          
          <div className="space-y-4">
            {/* Auto-select toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">Auto-select by Task Quality</label>
                <p className="text-xs text-gray-600">Automatically use best provider for each task (Claude for extraction/summary)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="auto-select-by-task"
                  name="auto-select-by-task"
                  type="checkbox"
                  checked={preferences.autoSelectByTask}
                  onChange={(e) => handleAutoSelectChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Manual provider selection */}
            {!preferences.autoSelectByTask && (
              <>
                {/* Preferred provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Provider (All Tasks)
                  </label>
                  <select
                    id="preferred-provider"
                    name="preferred-provider"
                    value={preferences.preferredProvider || 'auto'}
                    onChange={(e) => handlePreferredProviderChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="auto">Auto (Priority: Claude → GPT-4 → Gemini)</option>
                    {getAvailableProvidersWithKeys().map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Extraction provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extraction Provider (Structured Data)
                  </label>
                  <select
                    id="extraction-provider"
                    name="extraction-provider"
                    value={preferences.extractionProvider || 'auto'}
                    onChange={(e) => handleExtractionProviderChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="auto">Auto (Best: Claude Sonnet 3.5)</option>
                    {getAvailableProvidersWithKeys().map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.model}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Summarization provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Summarization Provider (Natural Language)
                  </label>
                  <select
                    id="summarization-provider"
                    name="summarization-provider"
                    value={preferences.summarizationProvider || 'auto'}
                    onChange={(e) => handleSummarizationProviderChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="auto">Auto (Best: Claude Sonnet 3.5)</option>
                    {getAvailableProvidersWithKeys().map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.model}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Provider Cards */}
      <div className="space-y-6">
        {providers.map(provider => {
          const hasKey = hasApiKey(provider.id);
          const testResult = testResults[provider.id];
          const testing = isTesting[provider.id];

          return (
            <div
              key={provider.id}
              className={`border rounded-lg p-6 ${
                provider.recommended ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              {/* Provider Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                    {provider.recommended && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-600 text-white rounded-full">
                        Recommended
                      </span>
                    )}
                    {hasKey && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{provider.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>Model: {provider.model}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{provider.pricing}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* API Key Input */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <input
                        id={`api-key-${provider.id}`}
                        name={`api-key-${provider.id}`}
                        type={showKeys[provider.id] ? 'text' : 'password'}
                        value={apiKeys[provider.id]}
                        onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                        placeholder={`Enter ${provider.name} API key`}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey(provider.id)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showKeys[provider.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSaveKey(provider.id)}
                    disabled={!apiKeys[provider.id].trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Key
                  </button>
                  <button
                    onClick={() => handleTestKey(provider.id)}
                    disabled={!apiKeys[provider.id].trim() || testing}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {testing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Test Key</span>
                      </>
                    )}
                  </button>
                  {hasKey && (
                    <button
                      onClick={() => handleClearKey(provider.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200"
                    >
                      Clear
                    </button>
                  )}
                  <a
                    href={provider.getKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-blue-600 text-sm font-medium hover:underline"
                  >
                    Get API Key →
                  </a>
                </div>

                {/* Test Result */}
                {testResult && (
                  <div
                    className={`flex items-center space-x-2 p-3 rounded-lg text-sm ${
                      testResult.success
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clear All Button */}
      {(hasApiKey('openai') || hasApiKey('anthropic') || hasApiKey('gemini')) && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
          >
            Clear All API Keys
          </button>
        </div>
      )}

      {/* Usage Guide */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">💡 Provider Recommendations</h4>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li><strong>Claude Sonnet 3.5 (BEST):</strong> Superior structured extraction and natural language summaries - $3/$15 per 1M tokens</li>
          <li><strong>GPT-4o (Excellent):</strong> Strong medical knowledge and reasoning - $2.50/$10 per 1M tokens</li>
          <li><strong>Gemini Pro (Budget):</strong> Best cost-to-performance ratio - $1.25/$5 per 1M tokens</li>
          <li><strong>Cost Estimate:</strong> ~$0.01-0.05 per discharge summary (depends on note length and provider)</li>
          <li><strong>Auto-select:</strong> Recommended - automatically uses Claude for best results</li>
          <li><strong>Fallback:</strong> If LLM fails, app automatically uses pattern matching (~35% accuracy)</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;
