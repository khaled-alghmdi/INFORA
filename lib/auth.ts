// Authentication utility functions

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('infora_user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

export const logout = () => {
  localStorage.removeItem('infora_user');
  window.location.href = '/login';
};

export const requireAuth = () => {
  if (typeof window !== 'undefined' && !isAuthenticated()) {
    window.location.href = '/login';
  }
};

