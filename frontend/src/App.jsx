import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage            from './pages/LoginPage';
import RegisterPage         from './pages/RegisterPage';
import HomePage             from './pages/HomePage';
import ChangePasswordPage   from './pages/ChangePasswordPage';
import ForgotPasswordPage   from './pages/ForgotPasswordPage';
import LessonPage           from './pages/LessonPage';
import ProfilePage          from './pages/ProfilePage';

export default function App() {
  return (
    <Routes>
      <Route path="/login"            element={<LoginPage />} />
      <Route path="/register"         element={<RegisterPage />} />
      <Route path="/home"             element={<HomePage />} />
      <Route path="/change-password"  element={<ChangePasswordPage />} />
      <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
      <Route path="/lesson/:id"       element={<LessonPage />} />
      <Route path="/profile"          element={<ProfilePage />} />
      <Route path="*"                 element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
