import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function AdminLogin({ onBackToHome, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, username, created_at')
        .eq('username', username.trim())
        .eq('password', password)
        .single();

      if (error || !data) {
        setErrorMessage('अवैध युझरनेम किंवा पासवर्ड (Invalid username or password)');
      } else {
        localStorage.setItem('adminUser', JSON.stringify(data));
        if (onLoginSuccess) {
          onLoginSuccess(data); // Triggers routing to AdminDashboard
        }
      }
    } catch (err) {
      setErrorMessage('सर्व्हर त्रुटी, कृपया पुन्हा प्रयत्न करा (Server error, please try again)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-orange-200 p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-orange-700">॥ श्री काळंबादेवी मंदिर ॥</h1>
          <p className="text-sm text-gray-500 mt-1">व्यवस्थापक लॉगिन (Admin Portal)</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              युझरनेम (Username)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="तुमचे युझरनेम टाका"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              पासवर्ड (Password)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow transition duration-200 disabled:opacity-50"
          >
            {loading ? 'पडताळणी सुरू आहे...' : 'लॉगिन करा'}
          </button>
        </form>

        {/* Return to Home */}
        <div className="mt-6 text-center border-t border-gray-100 pt-4">
          <button
            onClick={onBackToHome}
            type="button"
            className="text-sm text-orange-600 hover:text-orange-800 font-medium"
          >
            ← मुख्य पृष्ठावर परत जा (Back to Home)
          </button>
        </div>
      </div>
    </div>
  );
}