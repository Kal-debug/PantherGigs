// src/pages/CreateService.jsx
// Create service page with social media parser "magic button"

import React, { useState } from 'react';
import { Sparkles, Instagram, Facebook, Loader2, Check, AlertCircle } from 'lucide-react';
import { servicesAPI, parserAPI } from '../services/api';

const CreateService = () => {
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [showParser, setShowParser] = useState(false);
  const [parserCaption, setParserCaption] = useState('');
  const [parseResult, setParseResult] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    duration_min: '',
    base_price_usd: '',
  });

  const categories = [
    'Academic', 'Physical', 'Professional', 'Creative',
    'Health', 'Technology', 'Music', 'Transportation'
  ];

  const handleParseCaption = async () => {
    if (!parserCaption.trim()) {
      setError('Please paste a social media caption');
      return;
    }

    setParsing(true);
    setError('');
    setParseResult(null);

    try {
      const response = await parserAPI.parseCaption(parserCaption);
      const parsed = response.data;
      
      setParseResult(parsed);

      // Auto-fill form with parsed data
      setFormData({
        title: parsed.data.title || '',
        category: parsed.data.category || '',
        description: parsed.data.description || '',
        duration_min: parsed.data.duration_min || '',
        base_price_usd: parsed.data.base_price_usd || '',
      });

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to parse caption');
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await servicesAPI.create(formData);
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">List Your Service</h1>
          <p className="text-gray-600">Share your skills with the GSU community</p>
        </div>

        {/* Magic Button - Social Media Parser */}
        <div className="mb-8">
          <button
            onClick={() => setShowParser(!showParser)}
            className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 text-white py-4 px-6 rounded-2xl font-semibold text-lg shadow-lg hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-center space-x-3">
              <Sparkles className="w-6 h-6 animate-pulse" />
              <span>✨ Auto-Build from Social Media ✨</span>
              <div className="flex space-x-1">
                <Instagram className="w-5 h-5" />
                <Facebook className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute inset-0 -top-full group-hover:top-0 bg-white/20 transition-all duration-700"></div>
          </button>
          <p className="text-center text-sm text-gray-500 mt-2">
            Paste your Instagram/Facebook caption and we'll extract all the details automatically!
          </p>
        </div>

        {/* Parser Panel */}
        {showParser && (
          <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border-2 border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
              Social Media Caption Parser
            </h3>
            
            <textarea
              value={parserCaption}
              onChange={(e) => setParserCaption(e.target.value)}
              placeholder="📚 Math Tutoring Available! $25/hour for Calculus & Algebra help. Sessions are 60 minutes. DM me to book! #GSUTutoring"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 h-32 mb-4"
            />

            <button
              onClick={handleParseCaption}
              disabled={parsing}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition flex items-center justify-center disabled:opacity-50"
            >
              {parsing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Parse Caption
                </>
              )}
            </button>

            {/* Parse Result */}
            {parseResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center mb-2">
                  <Check className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-semibold text-green-800">
                    Extracted with {parseResult.metadata.confidence}% confidence!
                  </span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  {parseResult.metadata.extracted.title && <p>✓ Title extracted</p>}
                  {parseResult.metadata.extracted.price && <p>✓ Price extracted</p>}
                  {parseResult.metadata.extracted.duration && <p>✓ Duration extracted</p>}
                  {parseResult.metadata.extracted.category && <p>✓ Category classified</p>}
                </div>
                {parseResult.metadata.suggestions && (
                  <div className="mt-2 text-sm text-orange-700">
                    <p className="font-semibold">Suggestions:</p>
                    <ul className="list-disc list-inside">
                      {parseResult.metadata.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center">
              <Check className="w-5 h-5 text-green-600 mr-3" />
              <span className="text-green-800">Service created successfully! Redirecting...</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Math Tutoring for Calculus"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 h-32"
                placeholder="Describe your service..."
              />
            </div>

            {/* Duration and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration_min"
                  value={formData.duration_min}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="60"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  name="base_price_usd"
                  value={formData.base_price_usd}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="25.00"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Service'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateService;
