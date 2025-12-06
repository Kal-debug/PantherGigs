// src/pages/MyDashboard.jsx
// User's personal dashboard to manage bookings and services

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, DollarSign, MapPin, User, Package, 
  CheckCircle, XCircle, Loader, Edit, Trash2, Power, TrendingUp, Star, Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingsAPI, servicesAPI } from '../services/api';
import ReviewModal from '../components/ReviewModal';

const MyDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'services'
  const [myBookings, setMyBookings] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [providerBookings, setProviderBookings] = useState([]);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendingBookings: 0,
    activeServices: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch my bookings (as customer)
      const customerBookings = await bookingsAPI.getAll({ role: 'customer' });
      setMyBookings(customerBookings.data.data);

      // Fetch my services
      const user = JSON.parse(localStorage.getItem('user'));
      const services = await servicesAPI.getAll({ provider_id: user.user_id });
      setMyServices(services.data.data);

      // Fetch bookings for my services (as provider)
      const provBookings = await bookingsAPI.getAll({ role: 'provider' });
      setProviderBookings(provBookings.data.data);

      // Calculate stats
      const pending = provBookings.data.data.filter(b => b.status === 'pending').length;
      const active = services.data.data.filter(s => s.active).length;
      const earnings = provBookings.data.data
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + parseFloat(b.price_usd), 0);

      setStats({
        pendingBookings: pending,
        activeServices: active,
        totalEarnings: earnings,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    try {
      await bookingsAPI.updateStatus(bookingId, status);
      fetchData(); // Refresh data
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update booking');
    }
  };

  const toggleServiceActive = async (serviceId, currentActive) => {
    try {
      await servicesAPI.update(serviceId, { active: !currentActive });
      fetchData(); // Refresh data
    } catch (error) {
      alert('Failed to update service');
    }
  };

  const deleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    try {
      await servicesAPI.delete(serviceId);
      fetchData(); // Refresh data
    } catch (error) {
      alert('Failed to delete service');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Browse Services</span>
            </button>
          </div>
          
          {/* User Profile Card */}
          {(() => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            return (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{user.name || 'User'}</h2>
                  <p className="text-sm text-gray-600">{user.email || ''}</p>
                  {user.gsu_verified && (
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full mt-1">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      GSU Verified
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Calendar className="w-6 h-6" />}
            title="Pending Bookings"
            value={stats.pendingBookings}
            color="blue"
          />
          <StatCard
            icon={<Package className="w-6 h-6" />}
            title="Active Services"
            value={stats.activeServices}
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="Total Earnings"
            value={`$${stats.totalEarnings.toFixed(2)}`}
            color="purple"
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex-1 px-6 py-4 text-center font-medium transition ${
                  activeTab === 'bookings'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                My Bookings ({myBookings.length})
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex-1 px-6 py-4 text-center font-medium transition ${
                  activeTab === 'services'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                My Services ({myServices.length})
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'bookings' ? (
              <BookingsTab 
                bookings={myBookings}
                onReview={(booking) => {
                  setSelectedBookingForReview(booking);
                  setShowReviewModal(true);
                }}
              />
            ) : (
              <ServicesTab
                services={myServices}
                providerBookings={providerBookings}
                onToggleActive={toggleServiceActive}
                onDelete={deleteService}
                onUpdateBooking={updateBookingStatus}
              />
            )}
          </div>
        </div>

        {/* Review Modal */}
        <ReviewModal
          booking={selectedBookingForReview}
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedBookingForReview(null);
          }}
          onSuccess={() => {
            fetchData(); // Refresh data after review
          }}
        />
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon, title, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// My Bookings Tab
const BookingsTab = ({ bookings, onReview }) => {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">You haven't made any bookings yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <BookingCard 
          key={booking.booking_id} 
          booking={booking} 
          isCustomer={true}
          onReview={onReview}
        />
      ))}
    </div>
  );
};

// My Services Tab
const ServicesTab = ({ services, providerBookings, onToggleActive, onDelete, onUpdateBooking }) => {
  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">You haven't listed any services yet</p>
        <button
          onClick={() => (window.location.href = '/create-service')}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition"
        >
          Create Your First Service
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {services.map((service) => (
        <div key={service.service_id} className="border border-gray-200 rounded-xl p-6">
          {/* Service Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">{service.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  service.active 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {service.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-600">{service.category}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onToggleActive(service.service_id, service.active)}
                className={`p-2 rounded-lg transition ${
                  service.active
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
                title={service.active ? 'Deactivate' : 'Activate'}
              >
                <Power className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(service.service_id)}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              {service.duration_min} minutes
            </div>
            <div className="flex items-center text-gray-600 font-semibold">
              <DollarSign className="w-4 h-4 mr-1" />
              ${parseFloat(service.base_price_usd).toFixed(2)}
            </div>
          </div>

          {/* Bookings for this service */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-gray-900 mb-3">
              Bookings ({providerBookings.filter(b => b.service_id === service.service_id).length})
            </h4>
            <div className="space-y-3">
              {providerBookings
                .filter((b) => b.service_id === service.service_id)
                .map((booking) => (
                  <ProviderBookingCard
                    key={booking.booking_id}
                    booking={booking}
                    onUpdateStatus={onUpdateBooking}
                  />
                ))}
              {providerBookings.filter(b => b.service_id === service.service_id).length === 0 && (
                <p className="text-sm text-gray-500 italic">No bookings yet</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Booking Card (for customers)
const BookingCard = ({ booking, isCustomer, onReview }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900">{booking.service_title}</h3>
          <p className="text-sm text-gray-600">with {booking.provider_name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2" />
          {new Date(booking.start_at).toLocaleDateString()}
        </div>
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          {new Date(booking.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          {booking.building_name || 'TBD'}
        </div>
        <div className="flex items-center font-semibold text-blue-600">
          <DollarSign className="w-4 h-4 mr-1" />
          ${parseFloat(booking.price_usd).toFixed(2)}
        </div>
      </div>

      {/* Review Display (for customer) */}
      {booking.has_review === 1 && (
         <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
           <div className="flex items-center mb-1">
             <div className="flex text-yellow-400">
               {[...Array(5)].map((_, i) => (
                 <Star 
                   key={i} 
                   className={`w-4 h-4 ${i < booking.rating ? 'fill-current' : 'text-gray-300'}`} 
                 />
               ))}
             </div>
             <span className="ml-2 font-bold text-sm text-gray-700">{booking.rating}.0</span>
           </div>
           {booking.comment && (
             <p className="text-sm text-gray-600 italic">"{booking.comment}"</p>
           )}
         </div>
      )}

      {/* Leave Review Button (if completed and no review yet) */}
      {booking.status === 'completed' && !booking.has_review && onReview && (
        <button
          onClick={() => onReview(booking)}
          className="w-full px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:shadow-lg transition flex items-center justify-center mt-2"
        >
          <Star className="w-4 h-4 mr-2" />
          Leave a Review
        </button>
      )}
    </div>
  );
};

// Provider Booking Card (with status controls)
const ProviderBookingCard = ({ booking, onUpdateStatus }) => {
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-gray-900">{booking.customer_name}</p>
          <p className="text-sm text-gray-600">
            {new Date(booking.start_at).toLocaleDateString()} at{' '}
            {new Date(booking.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-sm text-gray-600">{booking.building_name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
          {booking.status}
        </span>
      </div>

      {/* Review Display (for provider) */}
      {booking.has_review === 1 && (
         <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
           <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Review from Customer</p>
           <div className="flex items-center mb-1">
             <div className="flex text-yellow-400">
               {[...Array(5)].map((_, i) => (
                 <Star 
                   key={i} 
                   className={`w-3 h-3 ${i < booking.rating ? 'fill-current' : 'text-gray-300'}`} 
                 />
               ))}
             </div>
             <span className="ml-2 font-bold text-xs text-gray-700">{booking.rating}.0</span>
           </div>
           {booking.comment && (
             <p className="text-sm text-gray-700 italic">"{booking.comment}"</p>
           )}
         </div>
      )}

      {/* Status Action Buttons */}
      {booking.status === 'pending' && (
        <div className="flex space-x-2 mt-3">
          <button
            onClick={() => onUpdateStatus(booking.booking_id, 'confirmed')}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center justify-center"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm
          </button>
          <button
            onClick={() => onUpdateStatus(booking.booking_id, 'cancelled')}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition flex items-center justify-center"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Cancel
          </button>
        </div>
      )}

      {booking.status === 'confirmed' && (
        <button
          onClick={() => onUpdateStatus(booking.booking_id, 'completed')}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center justify-center mt-3"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Mark as Complete
        </button>
      )}
    </div>
  );
};

export default MyDashboard;