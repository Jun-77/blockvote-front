import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import VoteList from './pages/VoteList';
import VoteDetail from './pages/VoteDetail';
// import OrganizationAuth from './pages/OrganizationAuth';
import AdminDashboard from './pages/AdminDashboard';
import OrgAdminDashboard from './pages/OrgAdminDashboard';
import SuperAdminOrganizations from './pages/SuperAdminOrganizations';
import OrganizationRegister from './pages/OrganizationRegister';
import CreateVote from './pages/CreateVote';

function ProtectedRoute({ children }) {
  const { account } = useAuth();

  // 로그인 안했으면 로그인 창으로
  if (!account) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// 관리자 전용 라우트 컴포넌트
function AdminRoute({ children }) {
  const { account, isAdmin, isOrgAdmin } = useAuth();

  if (!account) {
    return <Navigate to="/" replace />;
  }

  if (!isAdmin && !isOrgAdmin) {
    return <Navigate to="/votes" replace />;
  }

  return children;
}

function SuperAdminRoute({ children }) {
  const { account, isAdmin } = useAuth();
  if (!account) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/votes" replace />;
  return children;
}

function OrgAdminRoute({ children }) {
  const { account, isOrgAdmin } = useAuth();
  if (!account) return <Navigate to="/" replace />;
  if (!isOrgAdmin) return <Navigate to="/votes" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route element={<Layout />}>
        <Route
          path="/votes"
          element={
            <ProtectedRoute>
              <VoteList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/votes/:id"
          element={
            <ProtectedRoute>
              <VoteDetail />
            </ProtectedRoute>
          }
        />
        {false && (
          <Route
            path="/organization-auth"
            element={
              <ProtectedRoute>
                <OrganizationAuth />
              </ProtectedRoute>
            }
          />
        )}
        <Route
          path="/admin/dashboard"
          element={
            <SuperAdminRoute>
              <AdminDashboard />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/org-admin/dashboard"
          element={
            <OrgAdminRoute>
              <OrgAdminDashboard />
            </OrgAdminRoute>
          }
        />
        <Route
          path="/admin/create-vote"
          element={
            <OrgAdminRoute>
              <CreateVote />
            </OrgAdminRoute>
          }
        />
        <Route
          path="/super-admin/organizations"
          element={
            <SuperAdminRoute>
              <SuperAdminOrganizations />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/admin/register-organization"
          element={
            <SuperAdminRoute>
              <OrganizationRegister />
            </SuperAdminRoute>
          }
        />
      </Route>


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
