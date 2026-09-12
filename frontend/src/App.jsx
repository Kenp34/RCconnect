import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
<<<<<<< HEAD
import ProtectedRoute from './components/ProtectedRoute';
//import AdminRoute from './components/ProtectedRoute';
//import ManageRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import AdminPanel from './pages/AdminPanel'
import AdminLayout from './components/AdminLayout'; // ✅ Nouveau
import Manager from './pages/Manager'
=======
import ProtectedRoute from './Components/ProtectedRoute';
import Layout from './Components/Layout';
>>>>>>> 1e8f43a0069b6799091bfec45f3650567c0b22e0
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/profile';
import Message from './pages/Message';
import Directory from './pages/Directory';
import Group from './pages/Group';
import GroupChat from './pages/GroupChat';


// Ajouter dans les route

import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/feed" replace />} />

          <Route path="/feed" element={
            <ProtectedRoute>
              <Layout>
                <Feed />
              </Layout>
            </ProtectedRoute>
          } />

          {/* <Route path="/profile/:id" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } /> */}

        
           {/* ✅ Route unique pour le profil : accepte un _id OU un username */}
          <Route path="/profile/:identifier" element={
            <ProtectedRoute>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          } />
          {/* <Route path="/profile/me" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } /> */}

          <Route path="/messages" element={
            <ProtectedRoute>
              <Layout>
                <Message />
              </Layout>
            </ProtectedRoute>
          } />



          <Route path="/annuaire" element={
            <ProtectedRoute>
              <Layout>
                <Directory />
              </Layout>
            </ProtectedRoute>
          } />

          {/* 👥 ROUTES POUR LES GROUPES */}
          <Route path="/groups" element={
            <ProtectedRoute>
              <Layout>
                <Group />
              </Layout>
            </ProtectedRoute>
          } />

          {/* 👥 ROUTES POUR LES GROUPES
          <Route path="/groups/:id" element={
            <ProtectedRoute>
              <Layout>
                <GroupChat />
              </Layout>
            </ProtectedRoute>
          } /> */}
           /* 👥 ROUTES POUR LES GROUPES
          <Route path="/groups/:identifier" element={
            <ProtectedRoute>
              <Layout>
                <GroupChat />
              </Layout>
            </ProtectedRoute>
          } />
          {/* Redirection 404 */}
          <Route path="*" element={<Navigate to="/feed" replace />} />

          {/* ✅ Routes d'administration avec AdminLayout */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminPanel />} />

          </Route>

          {/* ✅ Routes d'administration avec AdminLayout */}
          <Route path="/manager" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Manager />} />

          </Route>
          {/* <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} /> */}
          {/* <Route path="/manager" element={<ManageRoute><Manager /></ManageRoute>} /> */}
        </Routes>



      </BrowserRouter>
    </AuthProvider>
  );
}


<<<<<<< HEAD




/*!SECTION
=======
>>>>>>> 1e8f43a0069b6799091bfec45f3650567c0b22e0

