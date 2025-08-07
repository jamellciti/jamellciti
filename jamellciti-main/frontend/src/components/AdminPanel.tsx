import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { APIKey } from '../types';
import { 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Eye, 
  EyeOff,
  Settings,
  Users,
  Shield,
  Database
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

export const AdminPanel: React.FC = () => {
  const { user } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyCity, setNewKeyCity] = useState('phoenix');
  const [loading, setLoading] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // Create new API key
  const createApiKey = async () => {
    if (!newKeyName.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/api-keys?name=${newKeyName}&city=${newKeyCity}`);
      const newKey: APIKey = response.data;
      
      setApiKeys(prev => [...prev, newKey]);
      setNewKeyName('');
      setNewKeyCity('phoenix');
      setShowNewKeyForm(false);
      
      // Show the new key by default
      setVisibleKeys(prev => {
        const newSet = new Set(prev);
        newSet.add(newKey.api_key);
        return newSet;
      });
      
      console.log('✅ API key created:', newKey.name);
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const toggleKeyVisibility = (keyValue: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyValue)) {
        newSet.delete(keyValue);
      } else {
        newSet.add(keyValue);
      }
      return newSet;
    });
  };

  const formatKey = (key: string, isVisible: boolean) => {
    if (isVisible) return key;
    return key.substring(0, 8) + '•'.repeat(16);
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 bg-gray-50 min-h-full flex items-center justify-center">
        <div className="text-center">
          <Shield size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need administrator privileges to access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-1">Manage API keys and system settings</p>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Database className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Database</p>
              <p className="text-lg font-semibold text-green-600">Online</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Clustering</p>
              <p className="text-lg font-semibold text-blue-600">Active</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Key className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">API Keys</p>
              <p className="text-lg font-semibold text-purple-600">{apiKeys.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-lg font-semibold text-orange-600">1</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
              <p className="text-gray-600 mt-1">Manage device authentication keys</p>
            </div>
            <button
              onClick={() => setShowNewKeyForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              <span>New API Key</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* New Key Form */}
          {showNewKeyForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-4">Create New API Key</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Phoenix IoT Devices"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <select
                    value={newKeyCity}
                    onChange={(e) => setNewKeyCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="phoenix">Phoenix</option>
                    <option value="tucson">Tucson</option>
                    <option value="demo">Demo</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={createApiKey}
                  disabled={loading || !newKeyName.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Key'}
                </button>
                <button
                  onClick={() => {
                    setShowNewKeyForm(false);
                    setNewKeyName('');
                    setNewKeyCity('phoenix');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* API Keys List */}
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
              <p className="text-gray-600 mb-4">Create your first API key to enable device authentication.</p>
              <button
                onClick={() => setShowNewKeyForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create API Key
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((apiKey, index) => {
                const isVisible = visibleKeys.has(apiKey.api_key);
                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Key size={16} className="text-gray-400" />
                          <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                            {apiKey.city}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                            {formatKey(apiKey.api_key, isVisible)}
                          </code>
                          <button
                            onClick={() => toggleKeyVisibility(apiKey.api_key)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title={isVisible ? 'Hide key' : 'Show key'}
                          >
                            {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(apiKey.api_key)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="Copy key"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Management Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Current system users</p>
        </div>
        <div className="p-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{user?.email}</h4>
                <p className="text-sm text-gray-600 capitalize">
                  {user?.role} • {user?.city}
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Demo Information</h3>
        <p className="text-blue-800 mb-4">
          This is a demonstration environment. In production, this panel would include:
        </p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Full user management with role-based access control</li>
          <li>API key revocation and rotation capabilities</li>
          <li>System health monitoring and alerts</li>
          <li>Audit logs and activity tracking</li>
          <li>Configuration management for clustering parameters</li>
        </ul>
      </div>
    </div>
  );
};