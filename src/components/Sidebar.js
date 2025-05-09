import React, { useEffect } from "react";
import { FiMenu, FiX } from "react-icons/fi";

export const menuItems = [
    { id: 1, label: "Home", icon: "🏠" },
    { id: 2, label: "Profile", icon: "👤" },
    { id: 3, label: "Matches", icon: "💞" },
    { id: 4, label: "Messages", icon: "✉️" },
    { id: 5, label: "Settings", icon: "⚙️" },
    { id: 6, label: "Registration", icon: "📝" },
    { id: 7, label: "Logout", icon: "🔓" },
];

function Sidebar({ activeMenu, setActiveMenu, isSidebarOpen, toggleSidebar }) {
    useEffect(() => {
        console.log("Sidebar component mounted with FiMenu/FiX icons");
    }, []);

    const sidebarStyle = {
        background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
        color: "white",
        flex: `0 0 ${isSidebarOpen ? "250px" : "60px"}`,
        display: "flex",
        flexDirection: "column",
        padding: isSidebarOpen ? 20 : "20px 10px",
        boxSizing: "border-box",
        transition: "flex 0.3s ease, padding 0.3s ease",
    };

    const sidebarHeaderStyle = {
        fontSize: isSidebarOpen ? "1.8rem" : "0",
        fontWeight: "700",
        marginBottom: isSidebarOpen ? 30 : 10,
        letterSpacing: 2,
        textAlign: "center",
        userSelect: "none",
        textShadow: "1px 1px 3px rgba(0,0,0,0.3)",
        visibility: isSidebarOpen ? "visible" : "hidden",
    };

    const menuItemStyle = (isActive) => ({
        display: "flex",
        alignItems: "center",
        padding: isSidebarOpen ? "12px 15px" : "12px 10px",
        marginBottom: 12,
        backgroundColor: isActive ? "rgba(255, 255, 255, 0.4)" : "transparent",
        borderRadius: 8,
        cursor: "pointer",
        transition: "background-color 0.3s ease, padding 0.3s ease",
        fontWeight: isActive ? "700" : "normal",
        boxShadow: isActive ? "0 0 8px rgba(255,255,255,0.7)" : "none",
        userSelect: "none",
        fontSize: isSidebarOpen ? "1.1rem" : "0",
        justifyContent: isSidebarOpen ? "flex-start" : "center",
    });

    const menuIconStyle = {
        marginRight: isSidebarOpen ? 12 : 0,
        fontSize: "1.3rem",
    };

    const toggleButtonStyle = {
        alignSelf: "flex-end",
        background: "rgba(255, 255, 255, 0.3)",
        color: "white",
        border: "none",
        borderRadius: "50%",
        padding: 10,
        cursor: "pointer",
        marginBottom: 20,
        fontSize: "1.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        transition: "background-color 0.2s ease, transform 0.2s ease",
    };

    const toggleButtonHoverStyle = {
        background: "rgba(255, 255, 255, 0.5)",
        transform: "scale(1.1)",
    };

    // We're just going to use the setActiveMenu function passed from App.js
    // which now includes navigation logic
    const handleMenuClick = (label) => {
        setActiveMenu(label);
    };

    return (
        <nav
            style={sidebarStyle}
            aria-label="Sidebar navigation with matrimony menu items"
            aria-expanded={isSidebarOpen}
        >
            <button
                style={toggleButtonStyle}
                onClick={toggleSidebar}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = toggleButtonHoverStyle.background;
                    e.currentTarget.style.transform = toggleButtonHoverStyle.transform;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = toggleButtonStyle.background;
                    e.currentTarget.style.transform = "scale(1)";
                }}
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
                {isSidebarOpen ? <FiX /> : <FiMenu />}
            </button>
            <div style={sidebarHeaderStyle}>Matrimony</div>
            {menuItems.map((item) => (
                <div
                    key={item.id}
                    style={menuItemStyle(activeMenu === item.label)}
                    onClick={() => handleMenuClick(item.label)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            handleMenuClick(item.label);
                        }
                    }}
                    aria-current={activeMenu === item.label ? "page" : undefined}
                    title={item.label}
                >
                    <span style={menuIconStyle} aria-hidden="true">
                        {item.icon}
                    </span>
                    {isSidebarOpen && <span>{item.label}</span>}
                </div>
            ))}
        </nav>
    );
}

export default Sidebar;