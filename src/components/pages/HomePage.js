import React, { useState, useEffect, useRef } from "react";
import { getDatabase, ref, get, query, orderByKey, startAfter, limitToFirst } from "firebase/database";
import { useNavigate, useLocation } from "react-router-dom";

function HomePage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasNextPage, setHasNextPage] = useState(true);
    const [lastFetchedKey, setLastFetchedKey] = useState(null);
    const [totalPagesDiscovered, setTotalPagesDiscovered] = useState(1);
    const [loadingPage, setLoadingPage] = useState(null);
    const [isDiscoveringPages, setIsDiscoveringPages] = useState(false);
    const [estimatedTotalPages, setEstimatedTotalPages] = useState(null);
    const [pageSearchValue, setPageSearchValue] = useState("");
    const [showPageSearch, setShowPageSearch] = useState(false);
    const [searchingPage, setSearchingPage] = useState(false);

    const [pageKeys, setPageKeys] = useState(() => {
        const savedKeys = localStorage.getItem("matrimony_users_pageKeys");
        if (savedKeys) {
            try {
                const parsed = JSON.parse(savedKeys);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch { }
        }
        return [null];
    });

    const [currentPage, setCurrentPage] = useState(() => {
        const savedPage = localStorage.getItem("matrimony_users_page");
        return savedPage ? parseInt(savedPage, 10) : 0;
    });

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1200);
    const navigate = useNavigate();
    const location = useLocation();
    const scrollPositionRef = useRef(0);
    const isRestoringStateRef = useRef(false);

    // Enhanced state restoration
    useEffect(() => {
        const handlePopState = (event) => {
            // Prevent page reload on browser back navigation
            isRestoringStateRef.current = true;
            console.log("Pop state detected - preventing reload");
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1200);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const saveScrollPosition = () => {
            scrollPositionRef.current = window.scrollY;
            sessionStorage.setItem("matrimony_scroll_position", window.scrollY.toString());
        };

        window.addEventListener("beforeunload", saveScrollPosition);
        return () => window.removeEventListener("beforeunload", saveScrollPosition);
    }, []);

    // Enhanced state restoration logic
    useEffect(() => {
        const isComingFromDetails = sessionStorage.getItem("matrimony_returning_from_details");
        const wasNavigated = sessionStorage.getItem("matrimony_navigated");

        if (isComingFromDetails === "true" || wasNavigated === "true") {
            console.log("Restoring state from navigation");
            isRestoringStateRef.current = true;

            // Restore saved state
            const savedPage = sessionStorage.getItem("matrimony_users_page");
            const savedKeys = sessionStorage.getItem("matrimony_users_pageKeys");
            const savedScrollPosition = sessionStorage.getItem("matrimony_scroll_position");
            const savedUsers = sessionStorage.getItem("matrimony_current_users");
            const savedTotalPages = sessionStorage.getItem("matrimony_total_pages");
            const savedEstimatedPages = sessionStorage.getItem("matrimony_estimated_pages");

            if (savedPage && savedKeys) {
                const pageNum = parseInt(savedPage, 10);
                const keys = JSON.parse(savedKeys);

                // Restore state without triggering new fetch
                setCurrentPage(pageNum);
                setPageKeys(keys);

                if (savedTotalPages) {
                    setTotalPagesDiscovered(parseInt(savedTotalPages, 10));
                }

                if (savedEstimatedPages) {
                    setEstimatedTotalPages(parseInt(savedEstimatedPages, 10));
                }

                // Restore users data if available
                if (savedUsers) {
                    try {
                        const usersData = JSON.parse(savedUsers);
                        setUsers(usersData);
                        setLoading(false);
                        console.log("Restored users from session storage");
                    } catch (error) {
                        console.log("Error restoring users data, will fetch fresh");
                    }
                }

                // Restore scroll position
                if (savedScrollPosition) {
                    setTimeout(() => {
                        window.scrollTo({
                            top: parseInt(savedScrollPosition, 10),
                            behavior: 'instant'
                        });
                        console.log("Restored scroll position");
                    }, 100);
                }
            }

            // Clear navigation flags
            sessionStorage.removeItem("matrimony_returning_from_details");
            sessionStorage.removeItem("matrimony_navigated");

            // Reset restoration flag after a delay
            setTimeout(() => {
                isRestoringStateRef.current = false;
            }, 1000);
        }
    }, [location.pathname]);

    useEffect(() => {
        estimateTotalPages();
    }, []);

    // Modified useEffect to prevent unnecessary fetching
    // Modified useEffect to handle pagination properly
    useEffect(() => {
        // Determine if we should fetch based on different conditions
        const shouldFetch =
            !isRestoringStateRef.current && (
                users.length === 0 || // First load
                loadingPage !== null || // Page navigation in progress
                currentPage !== parseInt(sessionStorage.getItem("matrimony_users_page") || "0", 10) // Page changed
            );

        if (shouldFetch) {
            console.log("Fetching users for page", currentPage);
            fetchUsers(pageKeys[currentPage]);
        }

        // Always update storage for persistence
        localStorage.setItem("matrimony_users_page", currentPage.toString());
        localStorage.setItem("matrimony_users_pageKeys", JSON.stringify(pageKeys));

        // Also update sessionStorage for immediate restoration
        sessionStorage.setItem("matrimony_users_page", currentPage.toString());
        sessionStorage.setItem("matrimony_users_pageKeys", JSON.stringify(pageKeys));
        sessionStorage.setItem("matrimony_total_pages", totalPagesDiscovered.toString());

        if (estimatedTotalPages) {
            sessionStorage.setItem("matrimony_estimated_pages", estimatedTotalPages.toString());
        }

        if (currentPage + 1 > totalPagesDiscovered) {
            setTotalPagesDiscovered(currentPage + 1);
        }
    }, [currentPage, pageKeys, totalPagesDiscovered, estimatedTotalPages, loadingPage]);

    // Save users data whenever it changes
    useEffect(() => {
        if (users.length > 0 && !isRestoringStateRef.current) {
            sessionStorage.setItem("matrimony_current_users", JSON.stringify(users));
            console.log("Saved users to session storage");
        }
    }, [users]);

    const estimateTotalPages = async () => {
        try {
            const db = getDatabase();
            const snapshot = await get(ref(db, "Matrimony/users"));
            if (snapshot.exists()) {
                const totalUsers = Object.keys(snapshot.val()).length;
                const estimated = Math.ceil(totalUsers / 100);
                setEstimatedTotalPages(estimated);
                sessionStorage.setItem("matrimony_estimated_pages", estimated.toString());
                console.log(`Estimated total pages: ${estimated} (${totalUsers} users)`);
            }
        } catch (error) {
            console.error("Error estimating total pages:", error);
        }
    };

    // Enhanced fetchUsers with better state management
    // Enhanced fetchUsers with better state management
    const fetchUsers = async (startKey) => {
        // Don't fetch if we're restoring state and already have users for the SAME page
        const savedPage = parseInt(sessionStorage.getItem("matrimony_users_page") || "0", 10);
        if (isRestoringStateRef.current && users.length > 0 && currentPage === savedPage) {
            console.log("Skipping fetch - restoring state with existing users for same page");
            setLoading(false);
            setLoadingPage(null);
            setSearchingPage(false);
            return;
        }

        try {
            setLoading(true);
            console.log("Fetching users with startKey:", startKey, "for page:", currentPage + 1);
            const db = getDatabase();
            const fetchLimit = 101;

            let queryRef;
            if (startKey) {
                queryRef = query(
                    ref(db, "Matrimony/users"),
                    orderByKey(),
                    startAfter(startKey),
                    limitToFirst(fetchLimit)
                );
            } else {
                queryRef = query(
                    ref(db, "Matrimony/users"),
                    orderByKey(),
                    limitToFirst(fetchLimit)
                );
            }

            const snapshot = await get(queryRef);
            if (snapshot.exists()) {
                const usersData = snapshot.val();
                const userEntries = Object.entries(usersData);

                setHasNextPage(userEntries.length > 100);

                const displayUsers = userEntries.slice(0, 100);
                setLastFetchedKey(displayUsers[displayUsers.length - 1]?.[0] || null);

                const pageUsers = displayUsers.map(([key, value]) => {
                    const personal = value.personal || {};
                    const educational = value.educational || {};
                    const contact = value.contact || {};
                    const fullName = [personal.firstName, personal.middleName, personal.lastName]
                        .filter(Boolean)
                        .join(" ");
                    const age = personal.dateOfBirth ? calculateAge(personal.dateOfBirth) : "Not specified";

                    let photo = null;
                    if (value.photos && Array.isArray(value.photos) && value.photos.length > 0) {
                        const validPhotos = value.photos.filter(photoUrl =>
                            photoUrl && typeof photoUrl === 'string' && isImageUrl(photoUrl)
                        );
                        if (validPhotos.length > 0) {
                            photo = validPhotos[0];
                        }
                    }

                    return {
                        id: key,
                        name: fullName || "Unnamed User",
                        age,
                        gender: personal.gender || "Not specified",
                        location: educational.currentPlace || educational.district || educational.nativePlace || "Not specified",
                        photo,
                        phoneNumber: personal.phoneNumber || contact.callingNumber || key,
                    };
                });

                setUsers(pageUsers);
                console.log("Successfully fetched", pageUsers.length, "users for page", currentPage + 1);
            } else {
                setUsers([]);
                setHasNextPage(false);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            setUsers([]);
            setHasNextPage(false);
        } finally {
            setLoading(false);
            setLoadingPage(null);
            setSearchingPage(false);
        }
    };

    const discoverPagesBatch = async (targetPage) => {
        if (isDiscoveringPages || targetPage < pageKeys.length) return pageKeys;

        setIsDiscoveringPages(true);
        const db = getDatabase();
        let currentKey = pageKeys[pageKeys.length - 1];
        let tempKeys = [...pageKeys];

        try {
            for (let i = pageKeys.length; i <= targetPage; i++) {
                const queryRef = currentKey
                    ? query(ref(db, "Matrimony/users"), orderByKey(), startAfter(currentKey), limitToFirst(100))
                    : query(ref(db, "Matrimony/users"), orderByKey(), limitToFirst(100));

                const snapshot = await get(queryRef);
                if (snapshot.exists()) {
                    const usersData = snapshot.val();
                    const userEntries = Object.entries(usersData);
                    if (userEntries.length > 0) {
                        currentKey = userEntries[userEntries.length - 1][0];
                        tempKeys.push(currentKey);
                        setTotalPagesDiscovered(tempKeys.length);
                    } else {
                        break;
                    }
                } else {
                    break;
                }
            }

            setPageKeys(tempKeys);
            localStorage.setItem("matrimony_users_pageKeys", JSON.stringify(tempKeys));
            sessionStorage.setItem("matrimony_users_pageKeys", JSON.stringify(tempKeys));
            return tempKeys;
        } catch (error) {
            console.error("Error discovering pages:", error);
            return pageKeys;
        } finally {
            setIsDiscoveringPages(false);
        }
    };

    const isImageUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const lowerUrl = url.toLowerCase();
        return (lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://')) &&
            imageExtensions.some(ext => lowerUrl.includes(ext));
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

    // Enhanced handleViewDetails with comprehensive state preservation
    const handleViewDetails = (id) => {
        console.log("Navigating to user details:", id);

        // Save current scroll position
        scrollPositionRef.current = window.scrollY;

        // Save all necessary state to sessionStorage for immediate access
        sessionStorage.setItem("matrimony_users_page", currentPage.toString());
        sessionStorage.setItem("matrimony_users_pageKeys", JSON.stringify(pageKeys));
        sessionStorage.setItem("matrimony_scroll_position", scrollPositionRef.current.toString());
        sessionStorage.setItem("matrimony_current_users", JSON.stringify(users));
        sessionStorage.setItem("matrimony_total_pages", totalPagesDiscovered.toString());
        if (estimatedTotalPages) {
            sessionStorage.setItem("matrimony_estimated_pages", estimatedTotalPages.toString());
        }
        sessionStorage.setItem("matrimony_returning_from_details", "true");
        sessionStorage.setItem("matrimony_navigated", "true");

        // Also save to localStorage for persistence
        localStorage.setItem("matrimony_users_page", currentPage.toString());
        localStorage.setItem("matrimony_users_pageKeys", JSON.stringify(pageKeys));
        localStorage.setItem("matrimony_scroll_position", scrollPositionRef.current.toString());

        console.log("State saved, navigating to details page");

        // Navigate to details page
        navigate(`/user/${id}`);
    };

    // NEW: Handle update photos navigation
    const handleUpdatePhotos = (userId) => {
        console.log("Navigating to update photos for user:", userId);

        // Save current scroll position
        scrollPositionRef.current = window.scrollY;

        // Save all necessary state to sessionStorage for immediate access
        sessionStorage.setItem("matrimony_users_page", currentPage.toString());
        sessionStorage.setItem("matrimony_users_pageKeys", JSON.stringify(pageKeys));
        sessionStorage.setItem("matrimony_scroll_position", scrollPositionRef.current.toString());
        sessionStorage.setItem("matrimony_current_users", JSON.stringify(users));
        sessionStorage.setItem("matrimony_total_pages", totalPagesDiscovered.toString());
        if (estimatedTotalPages) {
            sessionStorage.setItem("matrimony_estimated_pages", estimatedTotalPages.toString());
        }
        sessionStorage.setItem("matrimony_returning_from_details", "true");
        sessionStorage.setItem("matrimony_navigated", "true");

        // Also save to localStorage for persistence
        localStorage.setItem("matrimony_users_page", currentPage.toString());
        localStorage.setItem("matrimony_users_pageKeys", JSON.stringify(pageKeys));
        localStorage.setItem("matrimony_scroll_position", scrollPositionRef.current.toString());

        console.log("State saved, navigating to edit page");

        // Navigate to edit page
        navigate(`/edit/${userId}`);
    };

    const goToPage = async (targetPage) => {
        if (targetPage === currentPage || targetPage < 0) return;

        console.log("Going to page", targetPage + 1);

        setLoadingPage(targetPage);

        // Clear restoration flag when manually navigating
        isRestoringStateRef.current = false;

        // Clear cached users to force fresh fetch
        setUsers([]);

        // Discover pages if needed
        if (targetPage >= pageKeys.length) {
            await discoverPagesBatch(targetPage);
        }

        setCurrentPage(targetPage);

        if (!isRestoringStateRef.current) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const handleNextPage = () => {
        if (hasNextPage) {
            goToPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 0) {
            goToPage(currentPage - 1);
        }
    };

    // Enhanced page number generation with proper sliding window
    const generatePageNumbers = () => {
        const pages = [];
        const totalKnown = Math.max(totalPagesDiscovered, estimatedTotalPages || 1);
        const windowSize = isMobile ? 5 : 10;

        let windowStart = Math.max(0, currentPage - Math.floor(windowSize / 2));
        let windowEnd = windowStart + windowSize;

        if (windowEnd > totalKnown) {
            windowEnd = totalKnown;
            windowStart = Math.max(0, windowEnd - windowSize);
        }

        if (windowStart > 0) {
            pages.push(0);
            if (windowStart > 1) {
                pages.push('ellipsis-start');
            }
        }

        for (let i = windowStart; i < windowEnd; i++) {
            if (!pages.includes(i)) {
                pages.push(i);
            }
        }

        if (windowEnd < totalKnown) {
            if (windowEnd < totalKnown - 1) {
                pages.push('ellipsis-end');
            }
            for (let i = Math.max(windowEnd, totalKnown - 2); i < totalKnown; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }
        }

        return pages;
    };

    const handlePageSearch = async () => {
        const targetPage = parseInt(pageSearchValue, 10) - 1;
        const maxPage = estimatedTotalPages || totalPagesDiscovered;

        if (isNaN(targetPage) || targetPage < 0) {
            alert("Please enter a valid page number");
            return;
        }

        if (targetPage >= maxPage) {
            const shouldContinue = window.confirm(`Page ${pageSearchValue} might not exist. Current known range is 1-${maxPage}. Do you want to try anyway?`);
            if (!shouldContinue) return;
        }

        setSearchingPage(true);
        setShowPageSearch(false);
        setPageSearchValue("");

        await goToPage(targetPage);
    };

    const handleImageError = (e) => {
        e.target.style.display = 'none';
        e.target.nextSibling.style.display = 'flex';
    };

    // Get appropriate loading message
    const getLoadingMessage = () => {
        if (isRestoringStateRef.current) {
            return "✨ Restoring your view...";
        }
        if (searchingPage) {
            return "🔍 Searching for page...";
        }
        return "📊 Loading profiles...";
    };

    // Styles (keeping all your existing styles)
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
        border: "1px solid #d8b4fe",
    };

    const userCardHoverStyle = {
        transform: "translateY(-6px)",
        boxShadow: "0 12px 32px rgba(124, 58, 237, 0.2)",
        border: "1px solid #d8b4fe",
    };

    const userImageStyle = {
        width: "100%",
        height: isMobile ? "160px" : isTablet ? "200px" : "220px",
        objectFit: "cover",
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px",
    };

    const placeholderImageStyle = {
        ...userImageStyle,
        backgroundColor: "#e5e7eb",
        color: "#6b7280",
        display: "none",
        justifyContent: "center",
        alignItems: "center",
        fontSize: isMobile ? "0.9rem" : "1rem",
        fontWeight: "500",
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
        cursor: "pointer",
    };

    const buttonHoverStyle = {
        background: "linear-gradient(90deg, #6d28d9 0%, #c026d3 100%)",
        transform: "scale(1.03)",
    };

    // NEW: Style for Update Photos button
    const updatePhotosButtonStyle = {
        ...buttonStyle,
        background: "linear-gradient(90deg, #059669 0%, #047857 100%)",
        fontSize: isMobile ? "0.8rem" : "0.85rem",
        padding: isMobile ? "6px 12px" : "8px 14px",
        marginTop: "6px",
    };

    const updatePhotosButtonHoverStyle = {
        background: "linear-gradient(90deg, #047857 0%, #065f46 100%)",
        transform: "scale(1.03)",
    };

    // NEW: Button container style for multiple buttons
    const buttonContainerStyle = {
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: isMobile ? "6px" : "8px",
        marginTop: "10px",
    };

    const paginationContainerStyle = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: isMobile ? "4px" : "6px",
        margin: "24px 0",
        flexWrap: "wrap",
    };

    const pageButtonStyle = {
        padding: isMobile ? "8px 12px" : "10px 14px",
        border: "2px solid #e5e7eb",
        borderRadius: "8px",
        backgroundColor: "#ffffff",
        color: "#374151",
        fontWeight: "600",
        fontSize: isMobile ? "0.85rem" : "0.9rem",
        cursor: "pointer",
        transition: "all 0.2s ease",
        minWidth: isMobile ? "36px" : "40px",
        textAlign: "center",
    };

    const activePageButtonStyle = {
        ...pageButtonStyle,
        background: "linear-gradient(90deg, #7c3aed 0%, #db2777 100%)",
        color: "#ffffff",
        border: "2px solid #7c3aed",
        transform: "scale(1.1)",
        fontWeight: "700",
    };

    const disabledPageButtonStyle = {
        ...pageButtonStyle,
        opacity: 0.5,
        cursor: "not-allowed",
        backgroundColor: "#f3f4f6",
    };

    const loadingPageButtonStyle = {
        ...pageButtonStyle,
        background: "linear-gradient(90deg, #f59e0b 0%, #f97316 100%)",
        color: "#ffffff",
        border: "2px solid #f59e0b",
    };

    const ellipsisStyle = {
        padding: isMobile ? "8px 4px" : "10px 8px",
        color: "#6b7280",
        fontWeight: "600",
        fontSize: isMobile ? "0.85rem" : "0.9rem",
        cursor: "pointer",
        textAlign: "center",
    };

    const pageIndicatorStyle = {
        textAlign: "center",
        fontSize: isMobile ? "0.85rem" : "0.95rem",
        color: "#475569",
        margin: "16px 0",
        fontWeight: "500",
    };

    const searchContainerStyle = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
        margin: "16px 0",
        flexWrap: "wrap",
    };

    const searchInputStyle = {
        padding: "8px 12px",
        border: "2px solid #e5e7eb",
        borderRadius: "8px",
        fontSize: isMobile ? "0.9rem" : "1rem",
        width: "80px",
        textAlign: "center",
        outline: "none",
        transition: "border-color 0.2s ease",
    };

    const searchButtonStyle = {
        ...buttonStyle,
        padding: "8px 16px",
        marginTop: 0,
        alignSelf: "auto",
    };

    const progressDialogStyle = {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
    };

    const progressContentStyle = {
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "12px",
        textAlign: "center",
        maxWidth: "300px",
        width: "90%",
    };

    const restoringIndicatorStyle = {
        textAlign: "center",
        fontSize: isMobile ? "0.85rem" : "0.9rem",
        color: "#7c3aed",
        fontWeight: "600",
        padding: "8px 16px",
        backgroundColor: "rgba(124, 58, 237, 0.1)",
        borderRadius: "8px",
        margin: "8px 0",
        border: "1px solid rgba(124, 58, 237, 0.2)",
    };

    const genderIcon = (gender) => {
        if (gender.toLowerCase() === "male") return "👨";
        if (gender.toLowerCase() === "female") return "👩";
        return "🧑";
    };

    const handleMouseEnter = (e) => {
        Object.assign(e.currentTarget.style, userCardHoverStyle);
        const viewButton = e.currentTarget.querySelector("button[data-type='view']");
        const updateButton = e.currentTarget.querySelector("button[data-type='update']");
        if (viewButton) Object.assign(viewButton.style, buttonHoverStyle);
        if (updateButton) Object.assign(updateButton.style, updatePhotosButtonHoverStyle);
    };

    const handleMouseLeave = (e) => {
        Object.assign(e.currentTarget.style, userCardStyle);
        const viewButton = e.currentTarget.querySelector("button[data-type='view']");
        const updateButton = e.currentTarget.querySelector("button[data-type='update']");
        if (viewButton) Object.assign(viewButton.style, buttonStyle);
        if (updateButton) Object.assign(updateButton.style, updatePhotosButtonStyle);
    };

    return (
        <div style={pageStyle}>
            {/* Progress Dialog */}
            {(isDiscoveringPages || searchingPage) && (
                <div style={progressDialogStyle}>
                    <div style={progressContentStyle}>
                        <div style={{ fontSize: "1.2rem", marginBottom: "12px" }}>
                            {searchingPage ? "🔍 Searching Page..." : "📊 Discovering Pages..."}
                        </div>
                        <div style={{ color: "#6b7280" }}>
                            {searchingPage ? "Loading your requested page" : "Please wait while we find more pages"}
                        </div>
                        <div style={{ margin: "16px 0", color: "#7c3aed", fontWeight: "bold" }}>
                            ⏳ Loading...
                        </div>
                    </div>
                </div>
            )}

            <div style={headerStyle}>
                <h1 style={titleStyle}>MatchMaker Matrimony</h1>
                <p style={sloganStyle}>Discover your soulmate with love & compatibility</p>
            </div>

            <div style={pageIndicatorStyle}>
                Page {currentPage + 1} of {estimatedTotalPages ? `~${estimatedTotalPages}` : `${totalPagesDiscovered}+`} • Showing {users.length} profiles
            </div>

            {/* Page Search */}
            <div style={searchContainerStyle}>
                <span style={{ fontSize: isMobile ? "0.9rem" : "1rem", color: "#475569" }}>
                    Jump to page:
                </span>
                <input
                    type="number"
                    placeholder="Page #"
                    value={pageSearchValue}
                    onChange={(e) => setPageSearchValue(e.target.value)}
                    style={{
                        ...searchInputStyle,
                        borderColor: pageSearchValue ? "#7c3aed" : "#e5e7eb"
                    }}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handlePageSearch();
                        }
                    }}
                    min="1"
                    max={estimatedTotalPages || totalPagesDiscovered}
                />
                <button
                    style={searchButtonStyle}
                    onClick={handlePageSearch}
                    disabled={!pageSearchValue || searchingPage}
                >
                    {searchingPage ? "Searching..." : "Go"}
                </button>
            </div>

            {/* Show restoration indicator */}
            {isRestoringStateRef.current && (
                <div style={restoringIndicatorStyle}>
                    ✨ Restoring your previous view...
                </div>
            )}

            {loading && !isRestoringStateRef.current ? (
                <p style={{
                    fontSize: isMobile ? "0.9rem" : "1rem",
                    color: "#475569",
                    textAlign: "center",
                    padding: "40px 0"
                }}>
                    {getLoadingMessage()}
                </p>
            ) : users.length > 0 ? (
                <>
                    <ul style={listStyle}>
                        {users.map((user) => (
                            <li
                                key={user.id}
                                style={userCardStyle}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                {user.photo ? (
                                    <>
                                        <img
                                            src={user.photo}
                                            alt={user.name}
                                            style={userImageStyle}
                                            onError={handleImageError}
                                        />
                                        <div style={placeholderImageStyle}>
                                            No Image
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ ...placeholderImageStyle, display: 'flex' }}>
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

                                    {/* Updated button container with both buttons */}
                                    <div style={buttonContainerStyle}>
                                        <button
                                            style={buttonStyle}
                                            data-type="view"
                                            onClick={() => handleViewDetails(user.id)}
                                        >
                                            👁️ View Details
                                        </button>
                                        <button
                                            style={updatePhotosButtonStyle}
                                            data-type="update"
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent card click
                                                handleUpdatePhotos(user.id);
                                            }}
                                        >
                                            📸 Update Photos
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Enhanced Sliding Window Pagination */}
                    <div style={paginationContainerStyle}>
                        <button
                            style={currentPage === 0 ? disabledPageButtonStyle : pageButtonStyle}
                            onClick={handlePrevPage}
                            disabled={currentPage === 0}
                        >
                            ← Prev
                        </button>

                        {generatePageNumbers().map((page, index) => {
                            if (page === 'ellipsis-start') {
                                return (
                                    <span
                                        key={`ellipsis-start-${index}`}
                                        style={ellipsisStyle}
                                        onClick={() => goToPage(Math.max(0, currentPage - 10))}
                                        title="Go back 10 pages"
                                    >
                                        ...
                                    </span>
                                );
                            }

                            if (page === 'ellipsis-end') {
                                return (
                                    <span
                                        key={`ellipsis-end-${index}`}
                                        style={ellipsisStyle}
                                        onClick={() => goToPage(Math.min(currentPage + 10, (estimatedTotalPages || totalPagesDiscovered) - 1))}
                                        title="Go forward 10 pages"
                                    >
                                        ...
                                    </span>
                                );
                            }

                            const isCurrentPage = page === currentPage;
                            const isLoadingPage = loadingPage === page;

                            return (
                                <button
                                    key={page}
                                    style={
                                        isLoadingPage
                                            ? loadingPageButtonStyle
                                            : isCurrentPage
                                                ? activePageButtonStyle
                                                : pageButtonStyle
                                    }
                                    onClick={() => goToPage(page)}
                                    disabled={isLoadingPage}
                                    title={`Go to page ${page + 1}`}
                                >
                                    {isLoadingPage ? "..." : page + 1}
                                </button>
                            );
                        })}

                        <button
                            style={!hasNextPage ? disabledPageButtonStyle : pageButtonStyle}
                            onClick={handleNextPage}
                            disabled={!hasNextPage}
                        >
                            Next →
                        </button>
                    </div>
                </>
            ) : (
                <p style={{
                    fontSize: isMobile ? "0.9rem" : "1rem",
                    color: "#475569",
                    textAlign: "center",
                    padding: "40px 0"
                }}>
                    No profiles found.
                </p>
            )}
        </div>
    );
}

export default HomePage;
