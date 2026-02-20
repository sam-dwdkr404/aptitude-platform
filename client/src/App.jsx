import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import TestPage from "./pages/TestPage";
import ResultPage from "./pages/ResultPage";
import StudentQuestionHistory from "./pages/StudentQuestionHistory";
import AdminQuestionHistory from "./pages/AdminQuestionHistory";



function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />

      {/* Student */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/test"
        element={
          <ProtectedRoute role="student">
            <TestPage />
          </ProtectedRoute>
      }
    />
<Route
  path="/result"
  element={
    <ProtectedRoute role="student">
      <ResultPage />
    </ProtectedRoute>
  }
/>
      <Route
        path="/question-history"
        element={
          <ProtectedRoute role="student">
            <StudentQuestionHistory />
          </ProtectedRoute>
        }
      />
      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/question-bank"
        element={
          <ProtectedRoute role="admin">
            <AdminQuestionHistory />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
