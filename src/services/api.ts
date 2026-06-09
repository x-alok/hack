/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Auto-inject JWT token into every client-side request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hackathon_jwt');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
