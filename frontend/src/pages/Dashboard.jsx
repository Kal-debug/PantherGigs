// src/pages/Dashboard.jsx
// Main service listing dashboard with search and filters

import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Clock, DollarSign, MapPin, X, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { servicesAPI } from '../services/api';
import BookingWizard from '../components/BookingWizard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [selectedService, setSelectedService] = useState(null);
  const [showBookingWizard, setShowBookingWizard] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleBookService = (service) => {
    setSelectedService(service);
    setShowBookingWizard(true);
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const fetchServices = async (filters = {}) => {
    setLoading(true);
    try {
      const params = {
        active: true,
        ...filters,
      };
      const response = await servicesAPI.getAll(params);
      setServices(response.data.data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await servicesAPI.getCategories();
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = () => {
    const filters = {};
    if (searchQuery) filters.search = searchQuery;
    if (selectedCategory) filters.category = selectedCategory;
    if (priceRange.min) filters.min_price = priceRange.min;
    if (priceRange.max) filters.max_price = priceRange.max;
    fetchServices(filters);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setPriceRange({ min: '', max: '' });
    fetchServices();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              PantherGigs
            </h1>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/my-dashboard')}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition"
              >
                My Dashboard
              </button>
              <button 
                onClick={() => navigate('/create-service')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition"
              >
                List a Service
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for tutoring, photography, moving help..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center space-x-2 transition"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition"
            >
              Search
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.category} value={cat.category}>
                        {cat.category} ({cat.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    placeholder="$0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    placeholder="$100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Clear Filters</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Service Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {services.length} Services Available
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => (
                <ServiceCard 
                  key={service.service_id} 
                  service={service} 
                  index={index}
                  onBook={handleBookService}
                />
              ))}
            </div>

            {services.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No services found. Try adjusting your filters.</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Booking Wizard Modal */}
      <BookingWizard
        service={selectedService}
        isOpen={showBookingWizard}
        onClose={() => {
          setShowBookingWizard(false);
          setSelectedService(null);
          fetchServices(); // Refresh services after booking
        }}
      />
    </div>
  );
};

// Service Card Component
const ServiceCard = ({ service, index, onBook }) => {
  return (
    <div
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 cursor-pointer"
      style={{
        animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Card Header - Category Badge */}
      <div className="relative h-32 bg-gradient-to-br from-blue-500 to-cyan-500">
        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-blue-600">
            {service.category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6">
        {/* Provider Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-semibold">
              {service.provider_name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="font-semibold text-gray-900">{service.provider_name}</p>
              <div className="flex items-center text-xs text-gray-500">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                GSU Verified
              </div>
            </div>
          </div>
          {/* Star Rating */}
          {service.averageRating > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-900">
                {parseFloat(service.averageRating).toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">
                ({service.totalReviews})
              </span>
            </div>
          )}
        </div>

        {/* Service Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {service.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {service.description || 'No description available'}
        </p>

        {/* Service Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>{service.duration_min} minutes</span>
          </div>
          <div className="flex items-center text-sm font-semibold text-blue-600">
            <DollarSign className="w-4 h-4 mr-1" />
            <span>${parseFloat(service.base_price_usd).toFixed(2)}</span>
          </div>
        </div>

        {/* Book Button */}
        <button 
          onClick={() => onBook(service)}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

// Add fadeIn animation to your global CSS or Tailwind config
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

export default Dashboard;
