import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import QuizGenerator from "./pages/dashboard/QuizGenerator";
import AssignmentGenerator from "./pages/dashboard/AssignmentGenerator";
import PaperGenerator from "./pages/dashboard/PaperGenerator";
import SavedPapers from "./pages/dashboard/SavedPapers";
import Analytics from "./pages/dashboard/Analytics";
import Subscription from "./pages/dashboard/Subscription";
import AdminPanel from "./pages/admin/AdminPanel";
import PricingPage from "./pages/PricingPage";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === "admin" ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<DashboardHome />} />
        <Route path="quiz" element={<QuizGenerator />} />
        <Route path="assignment" element={<AssignmentGenerator />} />
        <Route path="paper" element={<PaperGenerator />} />
        <Route path="saved" element={<SavedPapers />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="subscription" element={<Subscription />} />
      </Route>
      <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
