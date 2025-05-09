import React from "react";

function MatchesPage() {
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
            <h1 style={headingStyle}>Matches</h1>
            <p style={paragraphStyle}>
                Discover potential matches tailored to your preferences. Browse profiles and start connecting.
            </p>
        </div>
    );
}

export default MatchesPage;