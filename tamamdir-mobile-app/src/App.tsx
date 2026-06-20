import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ServicesProvider } from "./context/ServicesContext";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ServicesPage from "./pages/ServicesPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import MessagesPage from "./pages/MessagesPage";
import HistoryPage from "./pages/HistoryPage";
import ProfilePage from "./pages/ProfilePage";
import AccountPage from "./pages/AccountPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import PersonalizationPage from "./pages/PersonalizationPage";
import AddNewServicePage from "./pages/AddNewServicePage";
import EditServicePage from "./pages/EditServicePage";
import ProfileManagePage from "./pages/ProfileManagePage";
import ServiceOwnerViewPage from "./pages/ServiceOwnerViewPage";
import OnboardingPage from "./pages/OnboardingPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl">progress_activity</span>
    </div>
  );
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />
      <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/services" element={<RequireAuth><ServicesPage /></RequireAuth>} />
      <Route path="/services/new" element={<RequireAuth><AddNewServicePage /></RequireAuth>} />
      <Route path="/services/:id/manage" element={<RequireAuth><ServiceOwnerViewPage /></RequireAuth>} />
      <Route path="/services/:id/edit" element={<RequireAuth><EditServicePage /></RequireAuth>} />
      <Route path="/services/:id" element={<RequireAuth><ServiceDetailPage /></RequireAuth>} />
      <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />
      <Route path="/history" element={<RequireAuth><HistoryPage /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/profile/manage" element={<RequireAuth><ProfileManagePage /></RequireAuth>} />
      <Route path="/account" element={<RequireAuth><AccountPage /></RequireAuth>} />
      <Route path="/account/settings" element={<RequireAuth><AccountSettingsPage /></RequireAuth>} />
      <Route path="/personalization" element={<RequireAuth><PersonalizationPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ServicesProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ServicesProvider>
    </AuthProvider>
  );
}

export default App;
