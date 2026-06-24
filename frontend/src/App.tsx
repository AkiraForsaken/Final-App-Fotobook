import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { TopBar } from "./components/TopBar.tsx";
import { Feeds } from "./pages/Feeds.tsx";
import { Discovery } from "./pages/Discovery.tsx";
import { LoginPage } from "./pages/Login.tsx";
import { SignupPage } from "./pages/Signup.tsx";
import type { User } from "./types/index.ts";
import { DataProvider } from "./contexts/DataContext.tsx";

const AppLayout = ({ currentUser, onLogout, onMenuToggle }: { currentUser: User | null; onLogout: () => void; onMenuToggle?: () => void }) => {
  return (
    <>
      <TopBar currentUser={currentUser} onLogout={onLogout} onMenuToggle={onMenuToggle} />
      <Outlet />
    </>
  );
}

const ProtectedRoute = ({ currentUser }: { currentUser: User | null }) => {
  const location = useLocation();
  if (!currentUser) {
    return (
      <Navigate to="/login" state={{ from: location }} replace />
    )
  }
  return (
    <DataProvider>
      <Outlet />
    </DataProvider>
  )
};

const App = () => {
  // Implement backend authentication later
  const LOCAL_STORAGE_USER = "fotobook.currentUser";
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(LOCAL_STORAGE_USER);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  });

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    window.localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    window.localStorage.removeItem(LOCAL_STORAGE_USER);
  };

  useEffect(() => {
    if (!currentUser) return;
    window.localStorage.setItem(LOCAL_STORAGE_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  // Mobile sidebar state lifted to App level
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout currentUser={currentUser} onLogout={handleLogout} onMenuToggle={() => setMobileOpen(true)} />}>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/signup" element={<SignupPage onLogin={handleLogin} />} />

          <Route element={<ProtectedRoute currentUser={currentUser} />}>
            <Route path="/feeds" element={<Feeds mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />} />
            <Route path="/discover" element={<Discovery currentUser={currentUser!} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />} />
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
