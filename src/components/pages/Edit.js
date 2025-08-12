import React, { useState, useEffect, useRef } from "react";
import { getDatabase, ref, set, get, update } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useParams, useNavigate } from "react-router-dom";

function Edit() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [biodataImage, setBiodataImage] = useState(null);
    const [userImages, setUserImages] = useState([]);
    const [dragOver, setDragOver] = useState({ biodata: false, photos: false });
    const [uploadProgress, setUploadProgress] = useState({ biodata: 0, photos: 0 });
    const [uploading, setUploading] = useState({ biodata: false, photos: false });
    const [uploadStatus, setUploadStatus] = useState("");
    const [currentFile, setCurrentFile] = useState("");
    const [errors, setErrors] = useState([]);
    const [autoSaving, setAutoSaving] = useState(false);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1200);

    const biodataFileInputRef = useRef(null);
    const photosFileInputRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1200);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (userId) {
            fetchUserData();
        }
    }, [userId]);

    // Enhanced function to validate Firebase Storage URLs
    const isValidFirebaseStorageUrl = (url) => {
        if (!url || typeof url !== 'string') return false;

        // Check if it's a valid Firebase Storage URL
        const firebaseStoragePattern = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\/]+\/o\/.+/;
        const firebaseStoragePattern2 = /^https:\/\/storage\.googleapis\.com\/[^\/]+\/.+/;

        return firebaseStoragePattern.test(url) || firebaseStoragePattern2.test(url);
    };

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const db = getDatabase();
            const userRef = ref(db, `Matrimony/users/${userId}`);
            const snapshot = await get(userRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                setUserData(data);

                // Only load biodata image if it's from Firebase Storage
                if (data.biodata && isValidFirebaseStorageUrl(data.biodata)) {
                    setBiodataImage(data.biodata);
                }

                // Only load photos if they're from Firebase Storage
                if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
                    const photosString = data.photos[0];
                    if (typeof photosString === 'string' && photosString.includes(',')) {
                        const photosArray = photosString
                            .split(',')
                            .map(url => url.trim())
                            .filter(url => url && isValidFirebaseStorageUrl(url));
                        setUserImages(photosArray);
                    } else if (Array.isArray(data.photos)) {
                        const validPhotos = data.photos.filter(url => isValidFirebaseStorageUrl(url));
                        setUserImages(validPhotos);
                    }
                }
            } else {
                alert("User not found!");
                navigate('/');
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            alert("Error loading user data");
        } finally {
            setLoading(false);
        }
    };

    // Auto-save function that updates database immediately
    const autoSaveToDatabase = async (type, newImageData) => {
        try {
            setAutoSaving(true);
            const db = getDatabase();
            const userRef = ref(db, `Matrimony/users/${userId}`);

            const updates = {};

            if (type === 'biodata') {
                updates.biodata = newImageData;
            } else if (type === 'photos') {
                if (newImageData.length > 0) {
                    updates.photos = [newImageData.join(',')];
                } else {
                    updates.photos = [];
                }
            }

            await update(userRef, updates);

            setUploadStatus(`✅ ${type === 'biodata' ? 'Biodata image' : 'Photos'} saved successfully!`);
            setTimeout(() => {
                setUploadStatus("");
            }, 3000);

        } catch (error) {
            console.error("Error auto-saving to database:", error);
            setErrors([`Failed to save ${type} to database. Please try again.`]);
            setTimeout(() => setErrors([]), 5000);
        } finally {
            setAutoSaving(false);
        }
    };

    const handleFileUpload = async (files, type) => {
        if (!files || files.length === 0) return;

        const storage = getStorage();
        const uploadedUrls = [];
        const uploadErrors = [];

        try {
            setUploading(prev => ({ ...prev, [type]: true }));
            setUploadProgress(prev => ({ ...prev, [type]: 0 }));
            setErrors([]);
            setUploadStatus(`🚀 Starting upload of ${files.length} file${files.length > 1 ? 's' : ''}...`);

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                setCurrentFile(file.name);
                setUploadStatus(`📤 Uploading ${file.name}...`);

                // Validate file type
                if (!file.type.startsWith('image/')) {
                    uploadErrors.push(`${file.name} is not an image file`);
                    continue;
                }

                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    uploadErrors.push(`${file.name} is too large (max 5MB)`);
                    continue;
                }

                try {
                    // Create unique filename
                    const timestamp = Date.now();
                    const randomStr = Math.random().toString(36).substring(2, 8);
                    const fileExtension = file.name.split('.').pop();
                    const filename = `${timestamp}_${randomStr}.${fileExtension}`;

                    // Create storage reference
                    const folderPath = type === 'biodata' ? 'bio' : 'photos';
                    const fileRef = storageRef(storage, `matrimony/${folderPath}/${filename}`);

                    // Upload file
                    setUploadStatus(`⬆️ Uploading ${file.name} to Firebase Storage...`);
                    const uploadResult = await uploadBytes(fileRef, file);
                    const downloadURL = await getDownloadURL(uploadResult.ref);
                    uploadedUrls.push(downloadURL);

                    setUploadStatus(`✅ Successfully uploaded ${file.name}`);
                } catch (fileError) {
                    console.error(`Error uploading ${file.name}:`, fileError);
                    uploadErrors.push(`Failed to upload ${file.name}`);
                }

                // Update progress
                const progress = Math.round(((i + 1) / files.length) * 100);
                setUploadProgress(prev => ({ ...prev, [type]: progress }));
            }

            // Auto-save to database immediately after upload
            if (uploadedUrls.length > 0) {
                setUploadStatus(`💾 Saving ${type} to database...`);

                if (type === 'biodata') {
                    setBiodataImage(uploadedUrls[0]);
                    await autoSaveToDatabase('biodata', uploadedUrls[0]);
                } else {
                    const newPhotos = [...userImages, ...uploadedUrls];
                    setUserImages(newPhotos);
                    await autoSaveToDatabase('photos', newPhotos);
                }
            }

            if (uploadErrors.length > 0) {
                setErrors(uploadErrors);
                setTimeout(() => setErrors([]), 8000);
            }

            return uploadedUrls;
        } catch (error) {
            console.error("Error uploading files:", error);
            setUploadStatus("❌ Upload failed. Please try again.");
            setErrors(["Upload failed. Please try again."]);
            setTimeout(() => {
                setUploadStatus("");
                setErrors([]);
            }, 5000);
            return [];
        } finally {
            setUploading(prev => ({ ...prev, [type]: false }));
            setCurrentFile("");
            setTimeout(() => {
                setUploadProgress(prev => ({ ...prev, [type]: 0 }));
            }, 3000);
        }
    };

    const handleBiodataUpload = async (files) => {
        if (files.length > 1) {
            setErrors(["Please select only one biodata image"]);
            setTimeout(() => setErrors([]), 3000);
            return;
        }

        await handleFileUpload(files, 'biodata');
    };

    const handlePhotosUpload = async (files) => {
        if (userImages.length + files.length > 10) {
            setErrors([`You can only have maximum 10 photos. Currently you have ${userImages.length} photos.`]);
            setTimeout(() => setErrors([]), 3000);
            return;
        }

        await handleFileUpload(files, 'photos');
    };

    const handleDragOver = (e, type) => {
        e.preventDefault();
        setDragOver(prev => ({ ...prev, [type]: true }));
    };

    const handleDragLeave = (e, type) => {
        e.preventDefault();
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOver(prev => ({ ...prev, [type]: false }));
        }
    };

    const handleDrop = (e, type) => {
        e.preventDefault();
        setDragOver(prev => ({ ...prev, [type]: false }));

        const files = Array.from(e.dataTransfer.files);
        if (type === 'biodata') {
            handleBiodataUpload(files);
        } else {
            handlePhotosUpload(files);
        }
    };

    const handleFileSelect = (e, type) => {
        const files = Array.from(e.target.files);
        if (type === 'biodata') {
            handleBiodataUpload(files);
        } else {
            handlePhotosUpload(files);
        }
        e.target.value = '';
    };

    const removeUserImage = async (index) => {
        const newImages = userImages.filter((_, i) => i !== index);
        setUserImages(newImages);
        await autoSaveToDatabase('photos', newImages);
    };

    const removeBiodataImage = async () => {
        setBiodataImage(null);
        await autoSaveToDatabase('biodata', null);
    };

    // Styles
    const pageStyle = {
        padding: isMobile ? "16px" : isTablet ? "24px" : "32px",
        background: "linear-gradient(135deg, #c3dafe 0%, #e9d5ff 100%)",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
    };

    const headerStyle = {
        textAlign: "center",
        margin: "0 0 32px 0",
        padding: isMobile ? "12px 0" : "16px 0",
    };

    const titleStyle = {
        fontSize: isMobile ? "1.5rem" : isTablet ? "1.8rem" : "2rem",
        fontWeight: "800",
        color: "#7c3aed",
        margin: 0,
        lineHeight: 1.2,
    };

    const sectionStyle = {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: isMobile ? "20px" : "32px",
        margin: "24px 0",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
        border: "1px solid #d8b4fe",
    };

    const sectionTitleStyle = {
        fontSize: isMobile ? "1.2rem" : "1.4rem",
        fontWeight: "700",
        color: "#1e293b",
        margin: "0 0 20px 0",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    };

    const dropZoneStyle = (isDragOver, isUploading) => ({
        border: `3px dashed ${isDragOver ? '#7c3aed' : isUploading ? '#f59e0b' : '#d1d5db'}`,
        borderRadius: "12px",
        padding: isMobile ? "24px 16px" : "40px 24px",
        textAlign: "center",
        backgroundColor: isDragOver ? "rgba(124, 58, 237, 0.05)" : isUploading ? "rgba(245, 158, 11, 0.05)" : "#f9fafb",
        cursor: isUploading ? "not-allowed" : "pointer",
        transition: "all 0.3s ease",
        margin: "16px 0",
        opacity: isUploading ? 0.7 : 1,
    });

    const dropZoneTextStyle = {
        fontSize: isMobile ? "0.9rem" : "1rem",
        color: "#6b7280",
        margin: "8px 0",
    };

    const imagePreviewContainerStyle = {
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(150px, 1fr))",
        gap: "16px",
        margin: "20px 0",
    };

    const imagePreviewStyle = {
        position: "relative",
        borderRadius: "8px",
        overflow: "hidden",
        border: "2px solid #e5e7eb",
        aspectRatio: "1",
    };

    const imageStyle = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    };

    const removeButtonStyle = {
        position: "absolute",
        top: "8px",
        right: "8px",
        backgroundColor: "#ef4444",
        color: "white",
        border: "none",
        borderRadius: "50%",
        width: "24px",
        height: "24px",
        cursor: "pointer",
        fontSize: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
    };

    const backButtonStyle = {
        padding: isMobile ? "12px 20px" : "14px 28px",
        background: "linear-gradient(90deg, #6b7280 0%, #4b5563 100%)",
        color: "#ffffff",
        border: "none",
        borderRadius: "10px",
        fontWeight: "600",
        fontSize: isMobile ? "0.9rem" : "1rem",
        cursor: "pointer",
        transition: "all 0.3s ease",
        margin: "32px auto",
        display: "block",
    };

    const selectButtonStyle = {
        padding: isMobile ? "8px 16px" : "10px 20px",
        background: "linear-gradient(90deg, #059669 0%, #047857 100%)",
        color: "#ffffff",
        border: "none",
        borderRadius: "8px",
        fontWeight: "600",
        fontSize: isMobile ? "0.85rem" : "0.9rem",
        cursor: "pointer",
        transition: "all 0.3s ease",
    };

    const progressDialogStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    };

    const progressContentStyle = {
        backgroundColor: "#ffffff",
        padding: "40px",
        borderRadius: "20px",
        textAlign: "center",
        maxWidth: "500px",
        width: "90%",
        boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
        border: "1px solid #e5e7eb",
    };

    const progressBarStyle = {
        width: "100%",
        height: "12px",
        backgroundColor: "#e5e7eb",
        borderRadius: "6px",
        overflow: "hidden",
        margin: "20px 0",
    };

    const progressFillStyle = (progress) => ({
        width: `${progress}%`,
        height: "100%",
        background: "linear-gradient(90deg, #7c3aed 0%, #db2777 100%)",
        transition: "width 0.3s ease",
        borderRadius: "6px",
    });

    const errorStyle = {
        backgroundColor: "#fee2e2",
        border: "1px solid #fecaca",
        borderRadius: "12px",
        padding: "16px 20px",
        margin: "16px 0",
        color: "#dc2626",
        fontSize: isMobile ? "0.9rem" : "1rem",
        fontWeight: "500",
    };

    const statusStyle = {
        backgroundColor: "#dcfce7",
        border: "1px solid #bbf7d0",
        borderRadius: "12px",
        padding: "16px 20px",
        margin: "16px 0",
        color: "#16a34a",
        fontSize: isMobile ? "0.9rem" : "1rem",
        fontWeight: "600",
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={progressDialogStyle}>
                    <div style={progressContentStyle}>
                        <div style={{ fontSize: "1.4rem", marginBottom: "20px" }}>
                            📊 Loading User Data...
                        </div>
                        <div style={{ color: "#6b7280" }}>
                            Please wait while we load the user information
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            {/* Enhanced Progress Dialog */}
            {(uploading.biodata || uploading.photos || autoSaving) && (
                <div style={progressDialogStyle}>
                    <div style={progressContentStyle}>
                        <div style={{ fontSize: "1.5rem", marginBottom: "20px" }}>
                            {autoSaving ? "💾 Auto-Saving..." : "📤 Uploading & Saving..."}
                        </div>

                        {!autoSaving && (
                            <>
                                <div style={progressBarStyle}>
                                    <div style={progressFillStyle(uploading.biodata ? uploadProgress.biodata : uploadProgress.photos)}></div>
                                </div>

                                <div style={{ color: "#6b7280", marginBottom: "12px", fontSize: "1.1rem" }}>
                                    {uploadProgress.biodata || uploadProgress.photos}% Complete
                                </div>

                                {currentFile && (
                                    <div style={{ color: "#374151", fontWeight: "600", marginBottom: "12px" }}>
                                        📁 {currentFile}
                                    </div>
                                )}
                            </>
                        )}

                        {uploadStatus && (
                            <div style={{
                                color: "#374151",
                                fontWeight: "500",
                                fontSize: "1rem",
                                padding: "12px",
                                backgroundColor: "#f8fafc",
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb"
                            }}>
                                {uploadStatus}
                            </div>
                        )}

                        {autoSaving && (
                            <div style={{ color: "#6b7280", fontSize: "1rem" }}>
                                Automatically saving to database...
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={headerStyle}>
                <h1 style={titleStyle}>📸 Update Photos</h1>
                <p style={{ color: "#6b7280", margin: "8px 0", fontSize: "1rem" }}>
                    {userData?.personal?.firstName} {userData?.personal?.lastName}
                </p>
                <p style={{ color: "#059669", margin: "8px 0", fontSize: "0.9rem", fontWeight: "500" }}>
                    ✨ Images are saved automatically after upload!
                </p>
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
                <div>
                    {errors.map((error, index) => (
                        <div key={index} style={errorStyle}>
                            ⚠️ {error}
                        </div>
                    ))}
                </div>
            )}

            {/* Success Status */}
            {uploadStatus && !uploading.biodata && !uploading.photos && !autoSaving && (
                <div style={statusStyle}>
                    {uploadStatus}
                </div>
            )}

            {/* Biodata Image Section */}
            <div style={sectionStyle}>
                <h2 style={sectionTitleStyle}>
                    📋 Biodata Image
                    <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: "400" }}>
                        (Single image only - Auto-saved)
                    </span>
                </h2>

                <div
                    style={dropZoneStyle(dragOver.biodata, uploading.biodata)}
                    onDragOver={(e) => handleDragOver(e, 'biodata')}
                    onDragLeave={(e) => handleDragLeave(e, 'biodata')}
                    onDrop={(e) => handleDrop(e, 'biodata')}
                    onClick={() => !uploading.biodata && biodataFileInputRef.current?.click()}
                >
                    <div style={{ fontSize: isMobile ? "2.5rem" : "4rem", marginBottom: "16px" }}>
                        {uploading.biodata ? "⏳" : "📋"}
                    </div>
                    <div style={dropZoneTextStyle}>
                        <strong>
                            {uploading.biodata ? "Uploading & saving biodata image..." : "Drop biodata image here"}
                        </strong>
                    </div>
                    {!uploading.biodata && (
                        <>
                            <div style={dropZoneTextStyle}>
                                Images will be automatically saved to Firebase
                            </div>
                            <button style={selectButtonStyle} type="button">
                                📂 Select Biodata Image
                            </button>
                        </>
                    )}
                </div>

                <input
                    ref={biodataFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'biodata')}
                    style={{ display: 'none' }}
                    disabled={uploading.biodata}
                />

                {biodataImage && (
                    <div style={{ margin: "24px 0" }}>
                        <h3 style={{ fontSize: "1.1rem", color: "#374151", margin: "0 0 16px 0" }}>
                            ✅ Current Biodata Image (From Firebase):
                        </h3>
                        <div style={imagePreviewStyle}>
                            <img src={biodataImage} alt="Biodata" style={imageStyle} />
                            <button
                                style={removeButtonStyle}
                                onClick={removeBiodataImage}
                                title="Remove image"
                                disabled={uploading.biodata || autoSaving}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Photos Section */}
            <div style={sectionStyle}>
                <h2 style={sectionTitleStyle}>
                    📷 User Photos
                    <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: "400" }}>
                        (Multiple images - Max 10 - Auto-saved)
                    </span>
                </h2>

                <div
                    style={dropZoneStyle(dragOver.photos, uploading.photos)}
                    onDragOver={(e) => handleDragOver(e, 'photos')}
                    onDragLeave={(e) => handleDragLeave(e, 'photos')}
                    onDrop={(e) => handleDrop(e, 'photos')}
                    onClick={() => !uploading.photos && photosFileInputRef.current?.click()}
                >
                    <div style={{ fontSize: isMobile ? "2.5rem" : "4rem", marginBottom: "16px" }}>
                        {uploading.photos ? "⏳" : "📷"}
                    </div>
                    <div style={dropZoneTextStyle}>
                        <strong>
                            {uploading.photos ? "Uploading & saving user photos..." : "Drop user photos here"}
                        </strong>
                    </div>
                    {!uploading.photos && (
                        <>
                            <div style={dropZoneTextStyle}>
                                Images will be automatically saved to Firebase
                            </div>
                            <button style={selectButtonStyle} type="button">
                                📂 Select User Photos
                            </button>
                        </>
                    )}
                </div>

                <input
                    ref={photosFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e, 'photos')}
                    style={{ display: 'none' }}
                    disabled={uploading.photos}
                />

                {userImages.length > 0 && (
                    <div>
                        <h3 style={{ fontSize: "1.1rem", color: "#374151", margin: "24px 0 16px 0" }}>
                            ✅ Current Photos ({userImages.length}/10) - From Firebase:
                        </h3>
                        <div style={imagePreviewContainerStyle}>
                            {userImages.map((url, index) => (
                                <div key={index} style={imagePreviewStyle}>
                                    <img src={url} alt={`Photo ${index + 1}`} style={imageStyle} />
                                    <button
                                        style={removeButtonStyle}
                                        onClick={() => removeUserImage(index)}
                                        title="Remove image"
                                        disabled={uploading.photos || autoSaving}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Back Button */}
            <button
                style={backButtonStyle}
                onClick={() => navigate('/')}
                disabled={uploading.biodata || uploading.photos || autoSaving}
            >
                ← Back to Home
            </button>
        </div>
    );
}

export default Edit;
