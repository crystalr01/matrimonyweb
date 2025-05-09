import React, { useState } from "react";
import { FiSave } from "react-icons/fi";
import { getDatabase, ref, set } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

function RegistrationForm() {
    // Form state
    const [formData, setFormData] = useState({
        personal: {
            phoneNumber: "",
            firstName: "",
            middleName: "",
            lastName: "",
            dateOfBirth: "",
            birthTime: "",
            heightFeet: "",
            heightInches: "",
            maritalStatus: "",
            gender: "Female",
            religion: "Hindu",
            caste: "Maratha",
            interCasteAllowed: "",
        },
        educational: {
            education: "",
            profession: "",
            currentPlace: "",
            nativePlace: "",
            taluka: "",
            district: "Sangli",
        },
        contact: {
            whatsappNumber: "",
            callingNumber: "",
        },
        photos: [],
        biodata: null,
    });

    const [errors, setErrors] = useState({});
    const [submissionStatus, setSubmissionStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Dropdown options
    const maritalStatusOptions = ["Single", "Married", "Divorced", "Widowed"];
    const genderOptions = ["Female"];
    const religionOptions = ["Hindu"];
    const casteOptions = {
        Hindu: ["Maratha"],
        Muslim: ["Sunni", "Shia", "Other"],
        Christian: ["Catholic", "Protestant", "Other"],
        Sikh: ["Jat", "Khatri", "Other"],
        Jain: ["Digambara", "Svetambara", "Other"],
        Buddhist: ["Theravada", "Mahayana", "Other"],
        Other: ["Other"],
    };
    const interCasteOptions = ["Yes", "No"];
    const educationOptions = ["High School", "Bachelor's", "Master's", "PhD", "Other"];
    const professionOptions = ["Engineer", "Doctor", "Teacher", "Business", "Student", "Other"];
    const districtOptions = ["Sangli"];

    // Handle input changes
    const handleInputChange = (section, e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const newFormData = {
                ...prev,
                [section]: { ...prev[section], [name]: value },
            };
            
            // If phone number is changed in personal details, update calling number
            if (section === "personal" && name === "phoneNumber") {
                newFormData.contact = {
                    ...newFormData.contact,
                    callingNumber: value
                };
            }
            
            return newFormData;
        });
        setErrors((prev) => ({ ...prev, [section]: { ...prev[section], [name]: "" } }));
    };  

    // Handle file uploads
    const handleFileChange = (type, e) => {
        const files = Array.from(e.target.files);
        if (type === "photos" && files.length + formData.photos.length > 5) {
            setErrors((prev) => ({ ...prev, photos: "Maximum 5 photos allowed" }));
            return;
        }
        setFormData((prev) => ({
            ...prev,
            [type]: type === "photos" ? [...prev.photos, ...files] : files[0],
        }));
        setErrors((prev) => ({ ...prev, [type]: "" }));
    };

    // Validate form
    const validateForm = () => {
        const newErrors = { personal: {}, educational: {}, contact: {}, photos: "", biodata: "" };
        // Personal
        if (!formData.personal.phoneNumber.trim() || !/^\d{10}$/.test(formData.personal.phoneNumber.trim()))
            newErrors.personal.phoneNumber = "Enter a valid 10-digit phone number";
        if (!formData.personal.firstName.trim()) newErrors.personal.firstName = "Required";
        if (!formData.personal.lastName.trim()) newErrors.personal.lastName = "Required";
        if (!formData.personal.dateOfBirth) newErrors.personal.dateOfBirth = "Required";
        if (!formData.personal.heightFeet || formData.personal.heightFeet < 1 || formData.personal.heightFeet > 10)
            newErrors.personal.heightFeet = "1–10";
        if (!formData.personal.heightInches || formData.personal.heightInches < 0 || formData.personal.heightInches > 11)
            newErrors.personal.heightInches = "0–11";
        if (!formData.personal.maritalStatus) newErrors.personal.maritalStatus = "Required";
        if (!formData.personal.gender) newErrors.personal.gender = "Required";
        if (!formData.personal.religion) newErrors.personal.religion = "Required";
        if (!formData.personal.caste) newErrors.personal.caste = "Required";
        if (!formData.personal.interCasteAllowed) newErrors.personal.interCasteAllowed = "Required";
        // Educational
        if (!formData.educational.education) newErrors.educational.education = "Required";
        if (!formData.educational.profession) newErrors.educational.profession = "Required";
        if (!formData.educational.currentPlace.trim()) newErrors.educational.currentPlace = "Required";
        if (!formData.educational.nativePlace.trim()) newErrors.educational.nativePlace = "Required";
        if (!formData.educational.taluka) newErrors.educational.taluka = "Required";
        if (!formData.educational.district) newErrors.educational.district = "Required";
        // Contact
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!formData.contact.whatsappNumber || !phoneRegex.test(formData.contact.whatsappNumber))
            newErrors.contact.whatsappNumber = "Invalid phone number";
        if (!formData.contact.callingNumber || !phoneRegex.test(formData.contact.callingNumber))
            newErrors.contact.callingNumber = "Invalid phone number";
        // Photos
        if (formData.photos.length === 0) newErrors.photos = "At least one photo required";
        if (!formData.biodata) newErrors.biodata = "Biodata photo required";

        setErrors(newErrors);
        return (
            Object.values(newErrors.personal).every((e) => !e) &&
            Object.values(newErrors.educational).every((e) => !e) &&
            Object.values(newErrors.contact).every((e) => !e) &&
            !newErrors.photos &&
            !newErrors.biodata
        );
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setSubmissionStatus({ type: "error", message: "Please fix the errors in the form" });
            return;
        }

        setIsLoading(true);
        setUploadProgress(0);

        try {
            const db = getDatabase();
            const storage = getStorage();
            const userKey = formData.personal.phoneNumber.replace(/[^0-9]/g, "");
            const userRef = ref(db, `Matrimony/users/${userKey}`);

            // Upload photos
            const totalFiles = formData.photos.length + (formData.biodata ? 1 : 0);
            let uploadedFiles = 0;

            const photoUrls = await Promise.all(
                formData.photos.map(async (file, index) => {
                    const photoRef = storageRef(storage, `Matrimony/users/${userKey}/photos/photo_${index}_${Date.now()}`);
                    await uploadBytes(photoRef, file);
                    uploadedFiles++;
                    setUploadProgress((uploadedFiles / totalFiles) * 100);
                    return getDownloadURL(photoRef);
                })
            );

            // Upload biodata
            let biodataUrl = null;
            if (formData.biodata) {
                const biodataRef = storageRef(storage, `Matrimony/users/${userKey}/biodata/biodata_${Date.now()}`);
                await uploadBytes(biodataRef, formData.biodata);
                uploadedFiles++;
                setUploadProgress((uploadedFiles / totalFiles) * 100);
                biodataUrl = await getDownloadURL(biodataRef);
            }

            // Save data
            await set(userRef, {
                personal: formData.personal,
                educational: formData.educational,
                contact: formData.contact,
                photos: photoUrls,
                biodata: biodataUrl,
                timestamp: Date.now(),
            });

            setSubmissionStatus({ type: "success", message: "Registration saved successfully!" });
            setFormData({
                personal: {
                    phoneNumber: "",
                    firstName: "",
                    middleName: "",
                    lastName: "",
                    dateOfBirth: "",
                    birthTime: "",
                    heightFeet: "",
                    heightInches: "",
                    maritalStatus: "",
                    gender: "Female",
                    religion: "Hindu",
                    caste: "Maratha",
                    interCasteAllowed: "",
                },
                educational: {
                    education: "",
                    profession: "",
                    currentPlace: "",
                    nativePlace: "",
                    taluka: "",
                    district: "Sangli",
                },
                contact: {
                    whatsappNumber: "",
                    callingNumber: "",
                },
                photos: [],
                biodata: null,
            });
            setErrors({});
        } catch (error) {
            setSubmissionStatus({ type: "error", message: `Error saving data: ${error.message}` });
        } finally {
            setIsLoading(false);
            setUploadProgress(0);
        }
    };

    // Responsive check
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1200;

    // Form styles
    const formContainerStyle = {
        background: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.1)",
        padding: isMobile ? "16px" : "24px",
        width: "100%",
        paddingLeft: "20px",
        background: "linear-gradient(135deg, #c3dafe 0%, #e9d5ff 100%)",
        boxSizing: "border-box",
        marginBottom: "20px",
        border: "1px solid rgba(106, 17, 203, 0.2)",
        transition: "box-shadow 0.3s ease",
    };

    const formTitleStyle = {
        fontSize: isMobile ? "1.7rem" : "2rem",
        fontWeight: "620",
        marginBottom: "16px",
        marginTop: "0px",
        paddingTop: "0px",
        background: "linear-gradient(90deg, #6a11cb, #2575fc)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        textAlign: isMobile ? "center" : "left",
        letterSpacing: "0.8px",
    };

    const formGridStyle = {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
        gap: isMobile ? "10px" : "14px",
    };

    const inputGroupStyle = {
        marginBottom: "12px",
        position: "relative",
    };

    const labelStyle = {
        display: "block",
        fontSize: isMobile ? "0.8rem" : "0.9rem",
        fontWeight: "600",
        color: "#1a1a1a",
        marginBottom: "6px",
        textTransform: "capitalize",
        letterSpacing: "0.5px",
    };

    const inputStyle = {
        width: "100%",
        padding: isMobile ? "9px" : "11px",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: isMobile ? "0.9rem" : "0.95rem",
        boxSizing: "border-box",
        outline: "none",
        background: "#fafafa",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
        color: "#1a1a1a",
    };

    const inputFocusStyle = {
        borderColor: "#6a11cb",
        boxShadow: "0 0 8px rgba(106, 17, 203, 0.3)",
        transform: "translateY(-1px)",
    };

    const selectStyle = {
        ...inputStyle,
        appearance: "none",
        background: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cGF0aCBmaWxsPSIjMTgxODE4IiBkPSJNOCAxMkwzIDcgNiA0IDggNiAxMCA0IDEzIDd6Ii8+PC9zdmc+") no-repeat right 12px center, #fafafa`,
        backgroundSize: "12px",
        paddingRight: "30px",
    };

    const heightContainerStyle = {
        display: "flex",
        gap: "8px",
    };

    const heightInputStyle = {
        ...inputStyle,
        width: "50%",
    };

    const fileInputStyle = {
        ...inputStyle,
        padding: "10px 14px",
        backgroundColor: "#f9f9fb",
        border: "1px solid #ccc",
        borderRadius: "8px",
        fontSize: "0.95rem",
        color: "#333",
        cursor: "pointer",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
    };

    const photoPreviewStyle = {
        display: "flex",
        flexWrap: "wrap",
        gap: "10px",
        marginTop: "10px",
    };

    const previewImageStyle = {
        width: isMobile ? "64px" : "80px",
        height: isMobile ? "64px" : "80px",
        objectFit: "cover",
        borderRadius: "10px",
        border: "2px solid #6a11cb",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        transition: "transform 0.2s ease",
    };

    const errorStyle = {
        fontSize: "0.75rem",
        color: "#e11d48",
        marginTop: "4px",
        display: "block",
        fontWeight: "500",
    };

    const submitButtonStyle = {
        background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        padding: isMobile ? "10px 20px" : "12px 24px",
        cursor: "pointer",
        fontSize: isMobile ? "0.9rem" : "1rem",
        fontWeight: "600",
        boxShadow: "0 4px 10px rgba(106, 17, 203, 0.25)",
        transition: "background 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease",
        display: "block",
        margin: "36px auto 0",
        letterSpacing: "0.8px",
    };

    const submitButtonHoverStyle = {
        background: "linear-gradient(135deg, #2575fc 0%, #6a11cb 100%)",
        transform: "scale(1.05)",
        boxShadow: "0 6px 14px rgba(106, 17, 203, 0.35)",
    };

    const statusStyle = (type) => ({
        fontSize: isMobile ? "0.9rem" : "0.95rem",
        color: type === "success" ? "#059669" : "#e11d48",
        marginTop: "12px",
        textAlign: "center",
        fontWeight: "600",
        background: type === "success" ? "rgba(5, 150, 105, 0.1)" : "rgba(225, 29, 72, 0.1)",
        padding: "8px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    });

    // Add loading overlay styles
    const loadingOverlayStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        color: "white",
    };

    const progressBarContainerStyle = {
        width: "80%",
        maxWidth: "400px",
        backgroundColor: "#e0e0e0",
        borderRadius: "10px",
        margin: "20px 0",
        overflow: "hidden",
    };

    const progressBarStyle = {
        width: `${uploadProgress}%`,
        height: "20px",
        backgroundColor: "#6a11cb",
        transition: "width 0.3s ease",
    };

    return (
        <div style={{ position: "relative" }}>
            {isLoading && (
                <div style={loadingOverlayStyle}>
                    <h2 style={{ marginBottom: "20px", fontSize: "1.5rem" }}>Uploading Data...</h2>
                    <div style={progressBarContainerStyle}>
                        <div style={progressBarStyle}></div>
                    </div>
                    <p style={{ fontSize: "1.1rem" }}>{Math.round(uploadProgress)}% Complete</p>
                </div>
            )}
            
            {/* Personal Details Form */}
            <div style={formContainerStyle}>
                <h2 style={formTitleStyle}>Personal Details</h2>
                <form onSubmit={handleSubmit}>
                    <div style={formGridStyle}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="phoneNumber">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                value={formData.personal.phoneNumber}
                                onChange={(e) => handleInputChange("personal", e)}
                                style={inputStyle}
                                placeholder="Enter 10-digit phone number"
                                maxLength="10"
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                                    e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = inputStyle.border;
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />
                            {errors.personal?.phoneNumber && <span style={errorStyle}>{errors.personal.phoneNumber}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="firstName">
                                First Name *
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.personal.firstName}
                                onChange={(e) => handleInputChange("personal", e)}
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
                            {errors.personal?.firstName && <span style={errorStyle}>{errors.personal.firstName}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="middleName">
                                Middle Name
                            </label>
                            <input
                                type="text"
                                id="middleName"
                                name="middleName"
                                value={formData.personal.middleName}
                                onChange={(e) => handleInputChange("personal", e)}
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
                            <label style={labelStyle} htmlFor="lastName">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.personal.lastName}
                                onChange={(e) => handleInputChange("personal", e)}
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
                            {errors.personal?.lastName && <span style={errorStyle}>{errors.personal.lastName}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="dateOfBirth">
                                Date of Birth *
                            </label>
                            <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                value={formData.personal.dateOfBirth}
                                onChange={(e) => handleInputChange("personal", e)}
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
                            {errors.personal?.dateOfBirth && <span style={errorStyle}>{errors.personal.dateOfBirth}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="birthTime">
                                Birth Time
                            </label>
                            <input
                                type="time"
                                id="birthTime"
                                name="birthTime"
                                value={formData.personal.birthTime}
                                onChange={(e) => handleInputChange("personal", e)}
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
                            <label style={labelStyle}>Height *</label>
                            <div style={heightContainerStyle}>
                                <input
                                    type="number"
                                    name="heightFeet"
                                    placeholder="Feet"
                                    value={formData.personal.heightFeet}
                                    onChange={(e) => handleInputChange("personal", e)}
                                    style={heightInputStyle}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                                        e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = inputStyle.border;
                                        e.currentTarget.style.boxShadow = "none";
                                    }}
                                />
                                <input
                                    type="number"
                                    name="heightInches"
                                    placeholder="Inches"
                                    value={formData.personal.heightInches}
                                    onChange={(e) => handleInputChange("personal", e)}
                                    style={heightInputStyle}
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
                            {(errors.personal?.heightFeet || errors.personal?.heightInches) && (
                                <span style={errorStyle}>{errors.personal.heightFeet || errors.personal.heightInches}</span>
                            )}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="maritalStatus">
                                Marital Status *
                            </label>
                            <select
                                id="maritalStatus"
                                name="maritalStatus"
                                value={formData.personal.maritalStatus}
                                onChange={(e) => handleInputChange("personal", e)}
                                style={selectStyle}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                                    e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = inputStyle.border;
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                <option value="">Select</option>
                                {maritalStatusOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            {errors.personal?.maritalStatus && <span style={errorStyle}>{errors.personal.maritalStatus}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="gender">
                                Gender *
                            </label>
                            <select
                                id="gender"
                                name="gender"
                                value={formData.personal.gender}
                                onChange={(e) => handleInputChange("personal", e)}
                                style={selectStyle}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                                    e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = inputStyle.border;
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                {genderOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            {errors.personal?.gender && <span style={errorStyle}>{errors.personal.gender}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="religion">
                                Religion *
                            </label>
                            <select
                                id="religion"
                                name="religion"
                                value={formData.personal.religion}
                                onChange={(e) => handleInputChange("personal", e)}
                                style={selectStyle}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                                    e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = inputStyle.border;
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                {religionOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            {errors.personal?.religion && <span style={errorStyle}>{errors.personal.religion}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="caste">
                                Caste *
                            </label>
                            <select
                                id="caste"
                                name="caste"
                                value={formData.personal.caste}
                                onChange={(e) => handleInputChange("personal", e)}
                                style={selectStyle}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                                    e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = inputStyle.border;
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                {(casteOptions[formData.personal.religion] || casteOptions.Other).map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            {errors.personal?.caste && <span style={errorStyle}>{errors.personal.caste}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="interCasteAllowed">
                                Inter-caste Allowed *
                            </label>
                            <select
                                id="interCasteAllowed"
                                name="interCasteAllowed"
                                value={formData.personal.interCasteAllowed}
                                onChange={(e) => handleInputChange("personal", e)}
                                style={selectStyle}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                                    e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = inputStyle.border;
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                <option value="">Select</option>
                                {interCasteOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            {errors.personal?.interCasteAllowed && <span style={errorStyle}>{errors.personal.interCasteAllowed}</span>}
                        </div>
                    </div>
                </form>
            </div>

            {/* Educational Details Form */}
            <div style={formContainerStyle}>
                <h2 style={formTitleStyle}>Educational Details</h2>
                <form onSubmit={handleSubmit}>
                    <div style={formGridStyle}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="education">
                                Education *
                            </label>
                            <input
                                type="text"
                                id="education"
                                name="education"
                                value={formData.educational.education}
                                onChange={(e) => handleInputChange("educational", e)}
                                style={inputStyle}
                                placeholder="Enter your education"
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                                    e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = inputStyle.border;
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />
                            {errors.educational?.education && <span style={errorStyle}>{errors.educational.education}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="profession">
                                Profession *
                            </label>
                            <input
                                type="text"
                                id="profession"
                                name="profession"
                                value={formData.educational.profession}
                                onChange={(e) => handleInputChange("educational", e)}
                                style={inputStyle}
                                placeholder="Enter your profession"
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                                    e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = inputStyle.border;
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />
                            {errors.educational?.profession && <span style={errorStyle}>{errors.educational.profession}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="currentPlace">
                                Current Place *
                            </label>
                            <input
                                type="text"
                                id="currentPlace"
                                name="currentPlace"
                                value={formData.educational.currentPlace}
                                onChange={(e) => handleInputChange("educational", e)}
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
                            {errors.educational?.currentPlace && <span style={errorStyle}>{errors.educational.currentPlace}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="nativePlace">
                                Native Place *
                            </label>
                            <input
                                type="text"
                                id="nativePlace"
                                name="nativePlace"
                                value={formData.educational.nativePlace}
                                onChange={(e) => handleInputChange("educational", e)}
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
                            {errors.educational?.nativePlace && <span style={errorStyle}>{errors.educational.nativePlace}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="taluka">
                                Taluka *
                            </label>
                            <input
                                type="text"
                                id="taluka"
                                name="taluka"
                                value={formData.educational.taluka}
                                onChange={(e) => handleInputChange("educational", e)}
                                style={inputStyle}
                                placeholder="Enter your taluka"
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                                    e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = inputStyle.border;
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />
                            {errors.educational?.taluka && <span style={errorStyle}>{errors.educational.taluka}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="district">
                                District *
                            </label>
                            <select
                                id="district"
                                name="district"
                                value={formData.educational.district}
                                onChange={(e) => handleInputChange("educational", e)}
                                style={selectStyle}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                                    e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = inputStyle.border;
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                {districtOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            {errors.educational?.district && <span style={errorStyle}>{errors.educational.district}</span>}
                        </div>
                    </div>
                </form>
            </div>

            {/* Contact Details Form */}
            <div style={formContainerStyle}>
                <h2 style={formTitleStyle}>Contact Details</h2>
                <form onSubmit={handleSubmit}>
                    <div style={formGridStyle}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="whatsappNumber">
                                WhatsApp Number *
                            </label>
                            <input
                                type="text"
                                id="whatsappNumber"
                                name="whatsappNumber"
                                value={formData.contact.whatsappNumber}
                                onChange={(e) => handleInputChange("contact", e)}
                                style={inputStyle}
                                placeholder="+1234567890"
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = inputFocusStyle.borderColor;
                                    e.currentTarget.style.boxShadow = inputFocusStyle.boxShadow;
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = inputStyle.border;
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />
                            {errors.contact?.whatsappNumber && <span style={errorStyle}>{errors.contact.whatsappNumber}</span>}
                        </div>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle} htmlFor="callingNumber">
                                Calling Number *
                            </label>
                            <input
                                type="text"
                                id="callingNumber"
                                name="callingNumber"
                                value={formData.personal.phoneNumber}
                                style={{
                                    ...inputStyle,
                                    backgroundColor: "#f0f0f0",
                                    cursor: "not-allowed",
                                    opacity: "0.8"
                                }}
                                readOnly
                            />
                        </div>
                    </div>
                </form>
            </div>

            {/* Photo Upload Form */}
            <div style={formContainerStyle}>
                <h2 style={formTitleStyle}>Photo Upload</h2>
                <form onSubmit={handleSubmit}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle} htmlFor="photos">
                            Photos (up to 5) *
                        </label>
                        <input
                            type="file"
                            id="photos"
                            name="photos"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleFileChange("photos", e)}
                            style={fileInputStyle}
                        />
                        {formData.photos.length > 0 && (
                            <div style={photoPreviewStyle}>
                                {formData.photos.map((file, index) => (
                                    <img
                                        key={index}
                                        src={URL.createObjectURL(file)}
                                        alt={`Preview ${index + 1}`}
                                        style={previewImageStyle}
                                    />
                                ))}
                            </div>
                        )}
                        {errors.photos && <span style={errorStyle}>{errors.photos}</span>}
                    </div>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle} htmlFor="biodata">
                            Biodata Photo *
                        </label>
                        <input
                            type="file"
                            id="biodata"
                            name="biodata"
                            accept="image/*"
                            onChange={(e) => handleFileChange("biodata", e)}
                            style={fileInputStyle}
                        />
                        {formData.biodata && (
                            <div style={photoPreviewStyle}>
                                <img
                                    src={URL.createObjectURL(formData.biodata)}
                                    alt="Biodata Preview"
                                    style={previewImageStyle}
                                />
                            </div>
                        )}
                        {errors.biodata && <span style={errorStyle}>{errors.biodata}</span>}
                    </div>
                    <button
                        type="submit"
                        style={submitButtonStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = submitButtonHoverStyle.background;
                            e.currentTarget.style.transform = submitButtonHoverStyle.transform;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = submitButtonStyle.background;
                            e.currentTarget.style.transform = "scale(1)";
                        }}
                    >
                        <FiSave size={18} /> Save All Details
                    </button>
                </form>
                {submissionStatus && (
                    <div style={statusStyle(submissionStatus.type)}>{submissionStatus.message}</div>
                )}
            </div>
        </div>
    );
}

export default RegistrationForm;