// API Configuration
// Determines the correct backend URL based on environment

export const getApiBaseUrl = () => {
  // During development with Vite dev server, use the proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, use the environment variable or fallback to production backend
  return import.meta.env.VITE_API_BASE_URL || 'https://czc-6n4ftl4kl-gerard-francis-v-pelonios-projects.vercel.app/api';
};

// Alternative: if you want to use the full URL always
export const getFullApiUrl = () => {
  // During development, still use full URL for clarity
  if (import.meta.env.DEV) {
    return `http://localhost:4000/api`;
  }
  
  // In production, use the production backend
  return import.meta.env.VITE_API_BASE_URL || 'https://czc-6n4ftl4kl-gerard-francis-v-pelonios-projects.vercel.app/api';
};
