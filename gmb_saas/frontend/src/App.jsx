import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import GeoGrid from './pages/GeoGrid';
import CompetitorAnalysis from './pages/CompetitorAnalysis';
import RankTracking from './pages/RankTracking';
import { Toaster } from 'react-hot-toast';

// Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-slate-900 text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Layout for authenticated pages
const AuthenticatedLayout = ({ children }) => (
  <div className="layout">
    <Sidebar />
    <main className="main-content">
      {children}
    </main>
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <AuthenticatedLayout><Dashboard /></AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AuthenticatedLayout><Dashboard /></AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/listings" element={
        <ProtectedRoute>
          <AuthenticatedLayout><Listings /></AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/listings/:id" element={
        <ProtectedRoute>
          <AuthenticatedLayout><ListingDetail /></AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/rankings" element={
        <ProtectedRoute>
          <AuthenticatedLayout><RankTracking /></AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/geogrid" element={
        <ProtectedRoute>
          <AuthenticatedLayout><GeoGrid /></AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/competitors" element={
        <ProtectedRoute>
          <AuthenticatedLayout><CompetitorAnalysis /></AuthenticatedLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AuthenticatedLayout><div className="p-4 text-white">Settings</div></AuthenticatedLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}


function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster position="top-right" />
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

