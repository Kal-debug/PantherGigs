// src/services/api.js
// API service for making backend calls

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance with base config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  getCurrentUser: () => api.get('/auth/me'),
};

// Services API
export const servicesAPI = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`),
  getCategories: () => api.get('/services/categories/list'),
};

// Bookings API
export const bookingsAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  getById: (id) => api.get(`/bookings/${id}`),
  create: (data) => api.post('/bookings', data),
  updateStatus: (id, status) => api.put(`/bookings/${id}`, { status }),
  delete: (id) => api.delete(`/bookings/${id}`),
};

// Parser API
export const parserAPI = {
  parseCaption: (caption) => api.post('/parser/parse-social-post', { caption }),
  getExamples: () => api.get('/parser/test-examples'),
};

// Walking Time API
export const walkingTimeAPI = {
  getBuildings: () => api.get('/walking-time/buildings'),
  calculateTime: (building1_id, building2_id) => 
    api.get('/walking-time/calculate', { params: { building1_id, building2_id } }),
};

// Reviews API
export const reviewsAPI = {
  getByService: (serviceId) => api.get(`/reviews/service/${serviceId}`),
  create: (data) => api.post('/reviews', data),
};

export default api;
