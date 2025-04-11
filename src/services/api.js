import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.13.19:4000/api', // IP de tu máquina o servidor
});

// Interceptor para incluir el token (opcional)
api.interceptors.request.use(async (config) => {
  // Recuperar token de AsyncStorage o SecureStore
  const token = await getTokenFromStorage(); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
export const registerUser = (userData) => {
    return api.post('/auth/register', userData);
  };
  
  export const loginUser = (credentials) => {
    return api.post('/auth/login', credentials);
  };
  
  export const forgotPassword = (email) => {
    return api.post('/auth/forgot-password', { email });
  };
  
  // etc.
  