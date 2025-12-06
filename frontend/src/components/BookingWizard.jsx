// src/components/BookingWizard.jsx
// Step-by-step booking wizard modal

import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, FileText, Check, AlertCircle } from 'lucide-react';
import { bookingsAPI, walkingTimeAPI } from '../services/api';

const BookingWizard = ({ service, isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buildings, setBuildings] = useState([]);
  
  const [bookingData, setBookingData] = useState({
    service_id: service?.service_id,
    building_id: '',
    start_at: '',
    ends_at: '',
    date: '',
    time: '',
    notes: '',
  });

  // Reset data when opening
  useEffect(() => {
    if (isOpen) {
      fetchBuildings();
      
      // RESET FORM
      setStep(1);
      setError('');
      setBookingData({
        service_id: service?.service_id,
        building_id: '',
        date: '',
        time: '',
        notes: '',
      });
    }
  }, [isOpen, service]);

  const fetchBuildings = async () => {
    try {
      const response = await walkingTimeAPI.getBuildings();
      setBuildings(response.data.data);
    } catch (error) {
      console.error('Error fetching buildings:', error);
    }
  };

  // Helper to format time to AM/PM
  const formatTimeDisplay = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  // Helper to fix the "Day Before" bug
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return new Date(year, month - 1, day).toLocaleDateString();
  };

  // Helper to get today's date in LOCAL time (Fixes the "Cannot book today" bug)
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleNext = () => {
    // Validation for Step 1
    if (step === 1) {
      if (!bookingData.date || !bookingData.time || !bookingData.building_id) {
        setError('Please fill in all required fields');
        return;
      }

      // GHOST BOOKING CHECK (Prevent Past Times)
      const selectedDateTime = new Date(`${bookingData.date}T${bookingData.time}`);
      const now = new Date();
      
      if (selectedDateTime < now) {
        setError('You cannot book a time in the past.');
        return;
      }
    }

    setError('');
    setStep(step + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      // Combine date and time
      const startDateTime = `${bookingData.date} ${bookingData.time}:00`;
      const startDate = new Date(startDateTime);
      const endDate = new Date(startDate.getTime() + service.duration_min * 60000);

      const payload = {
        service_id: service.service_id,
        building_id: parseInt(bookingData.building_id),
        start_at: startDateTime,
        ends_at: endDate.toISOString().slice(0, 19).replace('T', ' '),
      };

      await bookingsAPI.create(payload);
      
      // Success!
      alert('Booking created successfully!');
      onClose();
      
    } catch (err) {
      if (err.response?.data?.conflictType === 'walking_time_after' || 
          err.response?.data?.conflictType === 'walking_time_before') {
        setError(`⚠️ ${err.response.data.message}`);
      } else {
        setError(err.response?.data?.message || 'Failed to create booking');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: 'Date & Time' },
    { number: 2, title: 'Details' },
    { number: 3, title: 'Confirm' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Book Service</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (
              <React.Fragment key={s.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      step >= s.number
                        ? 'bg-white text-blue-600'
                        : 'bg-white/30 text-white'
                    }`}
                  >
                    {step > s.number ? <Check className="w-6 h-6" /> : s.number}
                  </div>
                  <span className="text-xs mt-2 text-white/90">{s.title}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${
                    step > s.number ? 'bg-white' : 'bg-white/30'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Service Info */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <h3 className="font-bold text-gray-900 mb-1">{service?.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{service?.duration_min} minutes</span>
              <span>${parseFloat(service?.base_price_usd).toFixed(2)}</span>
              <span>by {service?.provider_name}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step 1: Date, Time, Location */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => setBookingData({ ...bookingData, date: e.target.value })}
                  min={getTodayString()} // <--- FIXED HERE
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Time
                </label>
                <input
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-2" />
                  Meeting Location
                </label>
                <select
                  value={bookingData.building_id}
                  onChange={(e) => setBookingData({ ...bookingData, building_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a building</option>
                  {buildings.map((building) => (
                    <option key={building.building_id} value={building.building_id}>
                      {building.name} ({building.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Additional Details */}
          {step === 2 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline w-4 h-4 mr-2" />
                Additional Notes (Optional)
              </label>
              <textarea
                value={bookingData.notes}
                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 h-32"
                placeholder="Any specific requirements or questions for the provider?"
              />
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Review Your Booking</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Date</span>
                  <span className="font-semibold">
                    {formatDateDisplay(bookingData.date)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Time</span>
                  <span className="font-semibold">
                    {formatTimeDisplay(bookingData.time)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{service?.duration_min} minutes</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Location</span>
                  <span className="font-semibold">
                    {buildings.find(b => b.building_id == bookingData.building_id)?.name}
                  </span>
                </div>
                <div className="flex justify-between py-3 bg-blue-50 rounded-lg px-4 font-bold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">${parseFloat(service?.base_price_usd).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex justify-between">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition"
            >
              Back
            </button>
          )}
          
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="ml-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="ml-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Confirm Booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;