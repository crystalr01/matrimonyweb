import React from "react";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import MatchesPage from "./pages/MatchesPage";
import MessagesPage from "./pages/MessagesPage";
import SettingsPage from "./pages/SettingsPage";
import RegistrationForm from "./pages/RegistrationForm";

function Dashboard({ activeMenu, className }) {
    const mainContentStyle = {
        flex: 1,
        background: "#f7f7f7",
        paddingLeft: "20px",
        paddingRight: "20px",
        boxSizing: "border-box",
        width: "100%",
    };

    const renderContent = () => {
        switch (activeMenu) {
            case "Home":
                return <HomePage />;
            case "Profile":
                return <ProfilePage />;
            case "Matches":
                return <MatchesPage />;
            case "Messages":
                return <MessagesPage />;
            case "Settings":
                return <SettingsPage />;
            case "Registration":
                return <RegistrationForm />;
            default:
                return <HomePage />;
        }
    };

    return (
        <section style={mainContentStyle} className={className} aria-label="Main dashboard content">
            {renderContent()}
        </section>
    );
}

export default Dashboard;