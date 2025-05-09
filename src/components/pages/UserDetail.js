import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDatabase, ref, get } from "firebase/database";

function UserDetail() {
    const { id } = useParams();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const db = getDatabase();
            const userRef = ref(db, `Matrimony/users/${id}`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                setUser(snapshot.val());
            } else {
                console.log("User not found");
            }
        };
        fetchUser();
    }, [id]);

    if (!user) {
        return <p style={styles.loading}>Loading...</p>;
    }

    const personal = user.personal || {};
    const educational = user.educational || {};
    const contact = user.contact || {};
    const fullName = [personal.firstName, personal.middleName, personal.lastName].filter(Boolean).join(" ");

    const calculateAge = (dob) => {
        if (!dob) return "N/A";
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div style={styles.container}>
            {/* Page Heading */}
            {/* <h1 style={styles.pageHeading}>User Profile</h1> */}

            {/* Profile Header */}
            <div style={styles.profileHeader}>
                <img
                    src={user.photos?.[0] || "https://via.placeholder.com/120"}
                    alt="Profile"
                    style={styles.profileImage}
                />
                <div style={styles.profileInfo}>
                    <h1 style={styles.name}>{fullName || "Unnamed User"}</h1>
                    <p style={styles.detail}>Age: {calculateAge(personal.dateOfBirth)}</p>
                    <p style={styles.detail}>Gender: {personal.gender || "N/A"}</p>
                    <p style={styles.detail}>Location: {educational.currentPlace || "N/A"}</p>
                </div>
            </div>

            {/* Personal Details */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Personal Details</h2>
                <div style={styles.detailsGrid}>
                    <p style={styles.detailItem}><strong>DOB:</strong> {personal.dateOfBirth || "N/A"}</p>
                    <p style={styles.detailItem}><strong>Birth Time:</strong> {personal.birthTime || "N/A"}</p>
                    <p style={styles.detailItem}><strong>Height:</strong> {personal.heightFeet || "?"} ft {personal.heightInches || "?"} in</p>
                    <p style={styles.detailItem}><strong>Marital Status:</strong> {personal.maritalStatus || "N/A"}</p>
                    <p style={styles.detailItem}><strong>Religion:</strong> {personal.religion || "N/A"}</p>
                    <p style={styles.detailItem}><strong>Caste:</strong> {personal.caste || "N/A"}</p>
                    <p style={styles.detailItem}><strong>Inter-Caste:</strong> {personal.interCasteAllowed || "N/A"}</p>
                </div>
            </div>

            {/* Educational Details */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Education & Profession</h2>
                <div style={styles.detailsGrid}>
                    <p style={styles.detailItem}><strong>Education:</strong> {educational.education || "N/A"}</p>
                    <p style={styles.detailItem}><strong>Profession:</strong> {educational.profession || "N/A"}</p>
                    <p style={styles.detailItem}><strong>Current Place:</strong> {educational.currentPlace || "N/A"}</p>
                    <p style={styles.detailItem}><strong>Native Place:</strong> {educational.nativePlace || "N/A"}</p>
                    <p style={styles.detailItem}><strong>Taluka:</strong> {educational.taluka || "N/A"}</p>
                    <p style={styles.detailItem}><strong>District:</strong> {educational.district || "N/A"}</p>
                </div>
            </div>

            {/* Contact Details */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Contact Info</h2>
                <div style={styles.detailsGrid}>
                    <p style={styles.detailItem}><strong>WhatsApp:</strong> {contact.whatsappNumber || "N/A"}</p>
                    <p style={styles.detailItem}><strong>Phone:</strong> {contact.callingNumber || "N/A"}</p>
                </div>
            </div>

            {/* Photos Gallery */}
            {user.photos && user.photos.length > 0 && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Photos</h2>
                    <div style={styles.photoGallery}>
                        {user.photos.map((photo, index) => (
                            <img key={index} src={photo} alt={`Photo ${index + 1}`} style={styles.photo} />
                        ))}
                    </div>
                </div>
            )}

            {/* Biodata */}
            {user.biodata && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Biodata</h2>
                    <img src={user.biodata} alt="Biodata" style={styles.biodataImage} />
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: "30px",
        // fontFamily: "'Poppins', sans-serif",
        background: "linear-gradient(135deg, #c3dafe 0%, #e9d5ff 100%)",
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        margin: "0 auto",
        paddingLeft: "5%",
        paddingRight: "5%",
    },
    pageHeading: {
        fontSize: "2.8rem",
        fontWeight: "700",
        color: "#2e1065",
        textAlign: "left",
        margin: "20px 0 30px 0",
        letterSpacing: "1px",
        fontFamily: "'Poppins', sans-serif",
        textShadow: "1px 1px 3px rgba(0, 0, 0, 0.2)", // Subtle shadow for visual appeal
    },
    loading: {
        fontFamily: "'Poppins', sans-serif",
        fontSize: "1.2rem",
        color: "#4c1d95",
        textAlign: "center",
        padding: "30px",
    },
    profileHeader: {
        display: "flex",
        flexDirection: "row",
        gap: "20px",
        alignItems: "center",
        padding: "20px 0",
        flexWrap: "wrap",
    },
    profileImage: {
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "4px solid #7c3aed",
        transition: "transform 0.3s ease",
        cursor: "pointer",
    },
    profileInfo: {
        flex: 1,
        minWidth: "200px",
    },
    name: {
        fontSize: "2rem",
        fontWeight: "700",
        margin: "0 0 10px 0",
        color: "#2e1065",
        letterSpacing: "0.5px",
    },
    detail: {
        margin: "5px 0",
        fontSize: "1rem",
        color: "#4c1d95",
        fontWeight: "500",
    },
    section: {
        padding: "15px 0",
        borderBottom: "1px solid #e5e7eb",
    },
    sectionTitle: {
        fontSize: "1.4rem",
        fontWeight: "600",
        color: "#7c3aed",
        margin: "15px 0 10px 0",
    },
    detailsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "15px 20px",
        fontSize: "1rem",
        color: "#1f2937",
    },
    detailItem: {
        margin: "0",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        justifyContent: "flex-start",
        marginBottom: "10px",
    },
    photoGallery: {
        display: "flex",
        flexWrap: "wrap",
        gap: "15px",
    },
    photo: {
        width: "150px",
        height: "170px",
        objectFit: "cover",
        borderRadius: "8px",
        transition: "transform 0.3s ease",
        cursor: "pointer",
    },
    biodataImage: {
        width: "100%",
        maxWidth: "500px",
        borderRadius: "8px",
        transition: "transform 0.3s ease",
    },
};

// Add hover effects via inline event handlers
document.addEventListener("mouseover", (e) => {
    if (e.target.style.transition) {
        if (e.target.style.borderRadius === "50%" || e.target.style.objectFit === "cover" || e.target.style.maxWidth === "500px") {
            e.target.style.transform = "scale(1.05)";
        }
    }
});

document.addEventListener("mouseout", (e) => {
    if (e.target.style.transition) {
        e.target.style.transform = "scale(1)";
    }
});

export default UserDetail;