import React, { useState } from "react";
import { FiEdit, FiSave, FiCamera } from "react-icons/fi";

function ProfilePage() {
    // Mock user data
    const [user, setUser] = useState({
        name: "John Doe",
        age: 30,
        bio: "Passionate about travel and music. Looking for a meaningful connection.",
        preferences: "Enjoys hiking, reading, and good conversations.",
        photo: "https://via.placeholder.com/150",
    });

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...user });

    const handleEditToggle = () => {
        if (isEditing) {
            setUser({ ...formData });
        }
        setIsEditing(!isEditing);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = () => {
        console.log("Photo upload triggered (placeholder)");
    };

    // Responsive check
    const isMobile = window.innerWidth < 768;

    // Profile card styles
    const cardStyle = {
        background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
        color: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        padding: isMobile ? "20px" : "30px",
        marginBottom: "20px",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "center" : "flex-start",
        gap: isMobile ? "15px" : "30px",
        transition: "transform 0.3s ease",
        width: "100%",
        boxSizing: "border-box",
    };

    const cardHoverStyle = {
        transform: "scale(1.02)",
    };

    const photoContainerStyle = {
        position: "relative",
        display: "flex",
        justifyContent: "center",
    };

    const photoStyle = {
        width: isMobile ? "120px" : "150px",
        height: isMobile ? "120px" : "150px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "4px solid transparent",
        background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
        padding: "4px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
    };

    const uploadButtonStyle = {
        position: "absolute",
        bottom: "0",
        right: isMobile ? "auto" : "0",
        background: "rgba(255, 255, 255, 0.9)",
        color: "#6a11cb",
        border: "none",
        borderRadius: "50%",
        padding: "10px",
        cursor: "pointer",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        transition: "background-color 0.2s ease, transform 0.2s ease",
    };

    const uploadButtonHoverStyle = {
        background: "white",
        transform: "scale(1.15)",
    };

    const detailsStyle = {
        flex: 1,
        textAlign: isMobile ? "center" : "left",
    };

    const nameStyle = {
        fontSize: isMobile ? "2rem" : "2.5rem",
        fontWeight: "700",
        marginBottom: "10px",
        textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
    };

    const infoStyle = {
        fontSize: isMobile ? "1rem" : "1.2rem",
        marginBottom: "10px",
        lineHeight: "1.5",
    };

    const preferencesStyle = {
        fontSize: isMobile ? "0.9rem" : "1rem",
        fontStyle: "italic",
        marginBottom: "15px",
        opacity: 0.9,
    };

    const dividerStyle = {
        height: "2px",
        background: "linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.5), rgba(255,255,255,0.1))",
        margin: "15px 0",
        borderRadius: "2px",
    };

    const editButtonStyle = {
        background: "linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)",
        color: "#6a11cb",
        border: "none",
        borderRadius: "8px",
        padding: isMobile ? "10px 20px" : "12px 24px",
        cursor: "pointer",
        fontSize: isMobile ? "1rem" : "1.1rem",
        fontWeight: "700",
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        transition: "background-color 0.2s ease, transform 0.2s ease",
        display: "flex",
        alignItems: "center",
        gap: "10px",
    };

    const editButtonHoverStyle = {
        background: "linear-gradient(135deg, #e0e0e0 0%, #ffffff 100%)",
        transform: "scale(1.1)",
    };

    // Form styles
    const formContainerStyle = {
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        padding: isMobile ? "20px" : "30px",
        color: "#333",
        width: "100%",
        boxSizing: "border-box",
        transition: "opacity 0.3s ease, max-height 0.3s ease",
        opacity: isEditing ? 1 : 0,
        maxHeight: isEditing ? "1000px" : "0",
        overflow: "hidden",
    };

    const formTitleStyle = {
        fontSize: isMobile ? "1.8rem" : "2rem",
        fontWeight: "700",
        marginBottom: "20px",
        color: "#6a11cb",
        textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
    };

    const inputGroupStyle = {
        marginBottom: "20px",
    };

    const labelStyle = {
        display: "block",
        fontSize: isMobile ? "0.9rem" : "1rem",
        fontWeight: "500",
        color: "#555",
        marginBottom: "8px",
    };

    const inputStyle = {
        width: "100%",
        padding: isMobile ? "8px" : "10px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontSize: isMobile ? "0.9rem" : "1rem",
        boxSizing: "border-box",
        outline: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        background: "linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%)",
    };

    const inputFocusStyle = {
        borderColor: "#6a11cb",
        boxShadow: "0 0 8px rgba(106, 17, 203, 0.4)",
    };

    const textareaStyle = {
        ...inputStyle,
        resize: "vertical",
        minHeight: isMobile ? "80px" : "100px",
    };

    return (
        <div style={{ padding: isMobile ? "15px" : "20px", width: "100%", boxSizing: "border-box" }}>
            {/* Profile Card */}
            <div
                style={cardStyle}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = cardHoverStyle.transform;
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                }}
            >
                <div style={photoContainerStyle}>
                    <img src={user.photo} alt="Profile" style={photoStyle} />
                    {isEditing && (
                        <button
                            style={uploadButtonStyle}
                            onClick={handlePhotoUpload}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = uploadButtonHoverStyle.background;
                                e.currentTarget.style.transform = uploadButtonHoverStyle.transform;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = uploadButtonStyle.background;
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                            aria-label="Upload new profile photo"
                        >
                            <FiCamera size={20} />
                        </button>
                    )}
                </div>
                <div style={detailsStyle}>
                    <h1 style={nameStyle}>{user.name}</h1>
                    <p style={infoStyle}>Age: {user.age}</p>
                    <p style={infoStyle}>{user.bio}</p>
                    <div style={dividerStyle}></div>
                    <p style={preferencesStyle}>Preferences: {user.preferences}</p>
                </div>
                <button
                    style={editButtonStyle}
                    onClick={handleEditToggle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = editButtonHoverStyle.background;
                        e.currentTarget.style.transform = editButtonHoverStyle.transform;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = editButtonStyle.background;
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                >
                    {isEditing ? (
                        <>
                            <FiSave size={20} /> Save Profile
                        </>
                    ) : (
                        <>
                            <FiEdit size={20} /> Edit Profile
                        </>
                    )}
                </button>
            </div>

            {/* Edit Form */}
            <div style={formContainerStyle}>
                <h2 style={formTitleStyle}>Edit Profile</h2>
                <div style={inputGroupStyle}>
                    <label style={labelStyle} htmlFor="name">
                        Name
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={inputStyle}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                            e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = inputStyle.border;
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    />
                </div>
                <div style={inputGroupStyle}>
                    <label style={labelStyle} htmlFor="age">
                        Age
                    </label>
                    <input
                        type="number"
                        id="age"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        style={inputStyle}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                            e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = inputStyle.border;
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    />
                </div>
                <div style={inputGroupStyle}>
                    <label style={labelStyle} htmlFor="bio">
                        Bio
                    </label>
                    <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        style={textareaStyle}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                            e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = inputStyle.border;
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    />
                </div>
                <div style={inputGroupStyle}>
                    <label style={labelStyle} htmlFor="preferences">
                        Preferences
                    </label>
                    <textarea
                        id="preferences"
                        name="preferences"
                        value={formData.preferences}
                        onChange={handleInputChange}
                        style={textareaStyle}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                            e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = inputStyle.border;
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;