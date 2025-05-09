import React from "react";

function MessagesPage() {
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
            <h1 style={headingStyle}>Messages</h1>
            <p style={paragraphStyle}>
                Check your messages and start conversations with your matches. Stay connected and engaged.
            </p>
        </div>
    );
}

export default MessagesPage;