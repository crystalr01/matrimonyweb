import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Sidebar, { menuItems } from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import ProfileDetails from "./components/pages/ProfilePage";
import UserDetail from "./components/pages/UserDetail";
import UserLogin from "./components/pages/UserLogin";
import Edit from "./components/pages/Edit";
import "./App.css";
import PrivacyPolicy from "./components/pages/PrivacyPolicy";

function App() {
  const [activeMenu, setActiveMenu] = useState("Home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check localStorage for authentication on app load
  useEffect(() => {
    const storedPhone = localStorage.getItem("matrimonyUserPhone");
    if (storedPhone === "9370329233") {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  // Update document title based on active menu
  useEffect(() => {
    document.title = `Matrimony - ${activeMenu}`;
  }, [activeMenu]);

  // Update activeMenu based on current route
  useEffect(() => {
    const path = location.pathname;

    if (path === "/") {
      setActiveMenu("Home");
    } else if (path === "/login") {
      setActiveMenu("Login");
    } else if (
      path.startsWith("/profile/") ||
      path.startsWith("/user/") ||
      path.startsWith("/edit/")
    ) {
      // Don't change the active menu on detail pages or edit pages
      return;
    } else {
      const menuName = path.substring(1);
      const menuItem = menuItems.find(
        (item) => item.label.toLowerCase() === menuName.toLowerCase()
      );

      if (menuItem) {
        setActiveMenu(menuItem.label);
      }
    }
  }, [location]);

  // Redirect based on authentication status
  useEffect(() => {
    if (isAuthenticated && location.pathname === "/login") {
      navigate("/");
    } else if (
      !isAuthenticated &&
      location.pathname !== "/login" &&
      location.pathname !== "/privacy-policy" // ✅ allow public access
    ) {
      navigate("/login");
    }
  }, [isAuthenticated, location, navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleMenuClick = (label) => {
    if (label === "Logout") {
      alert("Logging out...");
      setIsAuthenticated(false);
      localStorage.removeItem("matrimonyUserPhone"); // Clear authentication
      setActiveMenu("Login");
      navigate("/login");
    } else {
      setActiveMenu(label);
      navigate(label === "Home" ? "/" : `/${label.toLowerCase()}`);
    }
  };

  // Handle successful login
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setActiveMenu("Home");
    navigate("/");
  };

  return (
    <div className="app-container" role="main" aria-label="Matrimony dashboard">
      {isAuthenticated && (
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={handleMenuClick}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
        />
      )}

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<UserLogin onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} /> {/* ✅ public */}

        {/* Private Routes */}
        {isAuthenticated && (
          <>
            <Route path="/" element={<Dashboard activeMenu="Home" className="dashboard" />} />
            <Route path="/profile" element={<Dashboard activeMenu="Profile" className="dashboard" />} />
            <Route path="/matches" element={<Dashboard activeMenu="Matches" className="dashboard" />} />
            <Route path="/messages" element={<Dashboard activeMenu="Messages" className="dashboard" />} />
            <Route path="/settings" element={<Dashboard activeMenu="Settings" className="dashboard" />} />
            <Route path="/registration" element={<Dashboard activeMenu="Registration" className="dashboard" />} />
            <Route path="/user/:id" element={<UserDetail />} />
            <Route path="/profile/:id" element={<ProfileDetails />} />
            <Route path="/edit/:userId" element={<Edit />} />
          </>
        )}
      </Routes>
    </div>
  );
}

export default App;
