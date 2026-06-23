import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom"
import { useState } from "react"
import { TopBar } from "./components/TopBar.tsx";
import { Feeds } from "./pages/Feeds.tsx";
import { Discovery } from "./pages/Discovery.tsx";
import { LoginPage } from "./pages/Login.tsx";
import { SignupPage } from "./pages/Signup.tsx";
import type { User } from "./types/index.ts";

const AppLayout = ({ currentUser, onLogout }: { currentUser: User | null; onLogout: () => void }) => {
  return (
    <>
      <TopBar currentUser={currentUser} onLogout={onLogout} />
      <Outlet />
    </>
  );
}

const ProtectedRoute = ({ currentUser }: { currentUser: User | null }) => {
  const location = useLocation();
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
};


const App = () => {

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const handleLogin = (user: User) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);


  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout currentUser={currentUser} onLogout={handleLogout} />}>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignupPage onLogin={handleLogin} />} />

          <Route element={<ProtectedRoute currentUser={currentUser} />}>
            <Route path="/feeds" element={<Feeds currentUser={currentUser!} />} />
            <Route path="/discover" element={<Discovery currentUser={currentUser!} />} />
            {/* Default */}
            <Route path="/" element={<Navigate to="/feeds" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
