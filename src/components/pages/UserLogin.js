import React, { useState } from 'react';
import logo from '../logo192.png';

const UserLogin = ({ onLoginSuccess }) => {
    const [mobileNumber, setMobileNumber] = useState('');
    const [username, setUsername] = useState('');
    const [gender, setGender] = useState('');
    const [serverOtp, setServerOtp] = useState('');
    const [showEnterOtp, setShowEnterOtp] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [otpError, setOtpError] = useState('');
    const [isPhoneNumberVerified, setIsPhoneNumberVerified] = useState(false);
    const [invalidMobileNumber, setInvalidMobileNumber] = useState(false);

    const handleSendOtp = (e) => {
        e.preventDefault();

        if (!/^\d{10}$/.test(mobileNumber.trim())) {
            setAlertMessage('Please enter a valid 10-digit mobile number.');
            return;
        }
        if (!username.trim()) {
            setAlertMessage('Please enter your name.');
            return;
        }
        if (!gender) {
            setAlertMessage('Please select your gender.');
            return;
        }
        if (mobileNumber.trim() !== '9370329233') {
            setInvalidMobileNumber(true);
            setAlertMessage('Invalid mobile number. Please use the registered number.');
            return;
        }

        setInvalidMobileNumber(false);
        setShowEnterOtp(true);
        setAlertMessage('Please enter the OTP.');
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();

        if (serverOtp.trim() === '123456') {
            localStorage.setItem('matrimonyUserPhone', mobileNumber);
            setAlertMessage('Login successful! Welcome to Matrimony Services.');
            setIsPhoneNumberVerified(true);
            setOtpError('');
            onLoginSuccess();
        } else {
            setOtpError('Invalid OTP. Please try again.');
            setAlertMessage('');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
            padding: '20px',
            boxSizing: 'border-box',
            width: '100vw',
            position: 'absolute',
            left: 0,
            top: 0,
        }}>
            <div style={{
                background: '#fff',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                width: '100%',
                maxWidth: '400px',
                boxSizing: 'border-box',
                margin: '0 auto',
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <img src={logo} alt="Matrimony Logo" style={{ height: '64px', margin: '0 auto' }} />
                </div>
                <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    color: '#333',
                    marginBottom: '1.5rem',
                    textShadow: '1px 1px 3px rgba(0,0,0,0.1)',
                }}>
                    Matrimony Login
                </h2>

                {!showEnterOtp ? (
                    <div>
                        <p style={{
                            textAlign: 'center',
                            color: '#666',
                            marginBottom: '1rem',
                            fontSize: '1rem',
                        }}>
                            Enter your details to proceed
                        </p>
                        <div style={{ marginBottom: '1rem' }}>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.3s ease',
                                }}
                                placeholder="Enter your name"
                                onFocus={(e) => (e.target.style.borderColor = '#2575fc')}
                                onBlur={(e) => (e.target.style.borderColor = '#ccc')}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    color: gender ? '#333' : '#999',
                                    transition: 'border-color 0.3s ease',
                                }}
                                onFocus={(e) => (e.target.style.borderColor = '#2575fc')}
                                onBlur={(e) => (e.target.style.borderColor = '#ccc')}
                            >
                                <option value="" disabled>Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{
                                    padding: '0.75rem',
                                    border: '1px solid #ccc',
                                    borderRight: 'none',
                                    borderRadius: '8px 0 0 8px',
                                    background: '#f5f5f5',
                                    color: '#666',
                                    fontSize: '1rem',
                                }}>
                                    +91
                                </span>
                                <input
                                    type="tel"
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        border: '1px solid #ccc',
                                        borderRadius: '0 8px 8px 0',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        transition: 'border-color 0.3s ease',
                                    }}
                                    placeholder="Enter mobile number"
                                    maxLength="10"
                                    onFocus={(e) => (e.target.style.borderColor = '#2575fc')}
                                    onBlur={(e) => (e.target.style.borderColor = '#ccc')}
                                />
                            </div>
                            {invalidMobileNumber && (
                                <p style={{ color: '#d32f2f', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                    Invalid mobile number
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleSendOtp}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'background 0.3s ease, transform 0.2s ease',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            }}
                            onMouseOver={(e) => (e.target.style.transform = 'scale(1.05)')}
                            onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
                        >
                            Proceed to OTP
                        </button>
                    </div>
                ) : (
                    <div>
                        <p style={{
                            textAlign: 'center',
                            color: '#666',
                            marginBottom: '1rem',
                            fontSize: '1rem',
                        }}>
                            Enter OTP for +91{mobileNumber}
                        </p>
                        <div style={{ marginBottom: '1rem' }}>
                            <input
                                type="text"
                                value={serverOtp}
                                onChange={(e) => setServerOtp(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                    transition: 'border-color 0.3s ease',
                                }}
                                placeholder="Enter OTP"
                                maxLength="6"
                                onFocus={(e) => (e.target.style.borderColor = '#2575fc')}
                                onBlur={(e) => (e.target.style.borderColor = '#ccc')}
                            />
                            {otpError && (
                                <p style={{ color: '#d32f2f', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                    {otpError}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleVerifyOtp}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'background 0.3s ease, transform 0.2s ease',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                            }}
                            onMouseOver={(e) => (e.target.style.transform = 'scale(1.05)')}
                            onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
                        >
                            Verify OTP
                        </button>
                        <button
                            onClick={() => {
                                setShowEnterOtp(false);
                                setServerOtp('');
                                setAlertMessage('');
                                setOtpError('');
                            }}
                            style={{
                                width: '100%',
                                marginTop: '0.5rem',
                                color: '#fff',
                                background: 'none',
                                border: 'none',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                transition: 'color 0.3s ease',
                            }}
                            onMouseOver={(e) => (e.target.style.color = '#ddd')}
                            onMouseOut={(e) => (e.target.style.color = '#fff')}
                        >
                            Change Number
                        </button>
                    </div>
                )}

                {alertMessage && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.9)',
                        color: alertMessage.includes('Invalid') || alertMessage.includes('Error') ? '#d32f2f' : '#2e7d32',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    }}>
                        {alertMessage}
                    </div>
                )}

                {isPhoneNumberVerified && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.9)',
                        color: '#2e7d32',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    }}>
                        Login successful! Redirecting to your profile...
                    </div>
                )}
            </div>

            <style>
                {`
          @media (max-width: 768px) {
            div[style*="maxWidth: 400px"] {
              max-width: 90%;
              padding: 1.5rem;
            }
            h2[style*="fontSize: 1.75rem"] {
              font-size: 1.5rem;
            }
            img[style*="height: 64px"] {
              height: 48px;
            }
            input, select, button {
              font-size: 0.9rem !important;
              padding: 0.6rem !important;
            }
            span[style*="padding: 0.75rem"] {
              padding: 0.6rem !important;
              font-size: 0.9rem !important;
            }
            p[style*="fontSize: 1rem"] {
              font-size: 0.9rem;
            }
          }
          @media (max-width: 480px) {
            div[style*="maxWidth: 400px"] {
              max-width: 95%;
              padding: 1rem;
            }
            h2[style*="fontSize: 1.75rem"] {
              font-size: 1.25rem;
            }
            img[style*="height: 64px"] {
              height: 40px;
            }
            input, select, button {
              font-size: 0.8rem !important;
              padding: 0.5rem !important;
            }
            span[style*="padding: 0.75rem"] {
              padding: 0.5rem !important;
              font-size: 0.8rem !important;
            }
            p[style*="fontSize: 1rem"] {
              font-size: 0.8rem;
            }
            div[style*="padding: 0.75rem"] {
              padding: 0.5rem !important;
              font-size: 0.75rem !important;
            }
          }
        `}
            </style>
        </div>
    );
};

export default UserLogin;