import React from "react";

function SettingsPage() {
    const headingStyle = {
        marginTop: 0,
        fontWeight: 700,
        color: "#333",
        userSelect: "none",
    };

    const paragraphStyle = {
        fontSize: "1rem",
        color: "#555",
        userSelect: "text",
        lineHeight: 1.5,
    };

    return (
        <div>
            <h1 style={headingStyle}>Settings</h1>
            <p style={paragraphStyle}>
                Customize your experience by adjusting account settings, notifications, and privacy options.
            </p>
        </div>
    );
}

export default SettingsPage;