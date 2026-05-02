export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// Call this when a fetch returns 403 "Account is blocked"
export function handleBlocked() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.setItem('auth_error', 'Your account has been blocked. Contact an administrator.');
  window.location.href = '/login';
}
