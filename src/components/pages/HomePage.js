import React, { useState, useEffect } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";

function HomePage() {
    const [users, setUsers] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1200);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1200);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const db = getDatabase();
        const usersRef = ref(db, "Matrimony/users");
        const snapshot = await get(usersRef);
        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const usersList = Object.entries(usersData).map(([key, value]) => {
                const personal = value.personal || {};
                const educational = value.educational || {};
                const fullName = [personal.firstName, personal.middleName, personal.lastName]
                    .filter(Boolean)
                    .join(" ");
                const age = personal.dateOfBirth ? calculateAge(personal.dateOfBirth) : "Not specified";
                return {
                    id: key,
                    name: fullName || "Unnamed User",
                    age,
                    gender: personal.gender || "Not specified",
                    location: educational.currentPlace || "Not specified",
                    photo: value.photos?.[0] || null,
                };
            });
            setUsers(usersList);
        } else {
            console.log("No users found");
        }
    };

    const calculateAge = (dob) => {
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const handleViewDetails = (id) => {
        navigate(`/user/${id}`);
    };

    // --- Styles ---
    const pageStyle = {
        padding: isMobile ? "16px" : isTablet ? "24px" : "32px",
        background: "linear-gradient(135deg, #c3dafe 0%, #e9d5ff 100%)",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
    };

    const headerStyle = {
        textAlign: "left",
        margin: 0,
        padding: isMobile ? "12px 0" : "16px 0",
    };

    const titleStyle = {
        fontSize: isMobile ? "1.5rem" : isTablet ? "1.8rem" : "2rem",
        fontWeight: "800",
        color: "#7c3aed",
        margin: 0,
        lineHeight: 1.2,
    };

    const sloganStyle = {
        fontSize: isMobile ? "0.9rem" : "1rem",
        color: "#475569",
        fontWeight: "400",
        margin: "4px 0 0 0",
    };

    const listStyle = {
        listStyleType: "none",
        padding: 0,
        display: "grid",
        gridTemplateColumns: isMobile
            ? "1fr"
            : isTablet
                ? "repeat(auto-fill, minmax(260px, 1fr))"
                : "repeat(auto-fill, minmax(300px, 1fr))",
        gap: isMobile ? "12px" : isTablet ? "16px" : "24px",
    };

    const userCardStyle = {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        border: "1px solid #d8b4fe", // Same border as hover state
    };

    const userCardHoverStyle = {
        transform: "translateY(-6px)",
        boxShadow: "0 12px 32px rgba(124, 58, 237, 0.2)",
        border: "1px solid #d8b4fe", // Maintain same border on hover
    };

    const userImageStyle = {
        width: "100%",
        height: isMobile ? "160px" : isTablet ? "200px" : "220px",
        objectFit: "cover",
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px",
    };

    const userDetailsStyle = {
        padding: isMobile ? "12px" : isTablet ? "16px" : "20px",
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        flex: 1,
    };

    const buttonStyle = {
        padding: isMobile ? "8px 14px" : "10px 18px",
        background: "linear-gradient(90deg, #7c3aed 0%, #db2777 100%)",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        fontWeight: "600",
        fontSize: isMobile ? "0.85rem" : "0.9rem",
        marginTop: "10px",
        alignSelf: "flex-start",
        transition: "all 0.3s ease",
    };

    const buttonHoverStyle = {
        background: "linear-gradient(90deg, #6d28d9 0%, #c026d3 100%)",
        transform: "scale(1.03)",
    };

    const genderIcon = (gender) => {
        if (gender.toLowerCase() === "male") return "👨";
        if (gender.toLowerCase() === "female") return "👩";
        return "🧑";
    };

    const handleMouseEnter = (e) => {
        Object.assign(e.currentTarget.style, userCardHoverStyle);
        const button = e.currentTarget.querySelector("button");
        if (button) Object.assign(button.style, buttonHoverStyle);
    };

    const handleMouseLeave = (e) => {
        Object.assign(e.currentTarget.style, userCardStyle);
        const button = e.currentTarget.querySelector("button");
        if (button) Object.assign(button.style, buttonStyle);
    };

    return (
        <div style={pageStyle}>
            <div style={headerStyle}>
                <h1 style={titleStyle}>MatchMaker Matrimony</h1>
                <p style={sloganStyle}>Discover your soulmate with love & compatibility</p>
            </div>

            {/* <h2 style={{
                fontSize: isMobile ? "1.1rem" : isTablet ? "1.3rem" : "1.5rem",
                fontWeight: "600",
                color: "#1e293b",
                margin: isMobile ? "16px 0" : "24px 0"
            }}>
                Featured Profiles
            </h2> */}

            {users.length > 0 ? (
                <ul style={listStyle}>
                    {users.map((user) => (
                        <li
                            key={user.id}
                            style={userCardStyle}
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            {user.photo ? (
                                <img src={user.photo} alt={user.name} style={userImageStyle} />
                            ) : (
                                <div
                                    style={{
                                        ...userImageStyle,
                                        backgroundColor: "#e5e7eb",
                                        color: "#6b7280",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        fontSize: isMobile ? "0.9rem" : "1rem",
                                        fontWeight: "500",
                                    }}
                                >
                                    No Image
                                </div>
                            )}
                            <div style={userDetailsStyle}>
                                <div style={{
                                    fontSize: isMobile ? "1rem" : isTablet ? "1.1rem" : "1.2rem",
                                    fontWeight: "700",
                                    color: "#1e293b"
                                }}>
                                    {user.name}
                                </div>
                                <div style={{ fontSize: isMobile ? "0.85rem" : "0.9rem", color: "#475569" }}>
                                    Age: {user.age}
                                </div>
                                <div style={{ fontSize: isMobile ? "0.85rem" : "0.9rem", color: "#475569" }}>
                                    Gender: {genderIcon(user.gender)} {user.gender}
                                </div>
                                <div style={{ fontSize: isMobile ? "0.85rem" : "0.9rem", color: "#475569" }}>
                                    📍 {user.location}
                                </div>
                                <button style={buttonStyle} onClick={() => handleViewDetails(user.id)}>
                                    View Details
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p style={{ fontSize: isMobile ? "0.9rem" : "1rem", color: "#475569" }}>Loading profiles...</p>
            )}
        </div>
    );
}

export default HomePage;