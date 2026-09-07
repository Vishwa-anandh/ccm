import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Initial check on mount only
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                    setIsAuthenticated(true);
                } catch (err) {
                    // Subscription expired — mark authenticated so protected routes don't
                    // redirect to /login before window.location.href fires
                    if (err?.response?.data?.subscriptionExpired) {
                        setIsAuthenticated(true);
                        setLoading(false);
                        window.location.href = '/subscription-expired';
                        return;
                    }
                    console.error("Token verification failed:", err);
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []); // Run only once on mount



    const login = async (email, password) => {
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            if (res.data.refreshToken) {
                localStorage.setItem('refreshToken', res.data.refreshToken);
            }
            // Always fetch /auth/me after login to get live DB permissions
            // (login response may have stale permission flags from token payload)
            try {
                const meRes = await api.get('/auth/me');
                setUser(meRes.data);
            } catch {
                setUser(res.data.user);
            }
            setIsAuthenticated(true);
            return { success: true };
        } catch (err) {
            console.error("Login failed:", err);
            if (err.response?.data?.subscriptionExpired) {
                window.location.href = '/subscription-expired';
                return { success: false, error: "subscription_expired" };
            }
            return {
                success: false,
                isLocked: err.response?.data?.isLocked || false,
                error: err.response?.data?.error || "Login failed"
            };
        }
    };

    const sendOtp = async (email) => {
        try {
            await api.post('/auth/send-otp', { email });
            return { success: true };
        } catch (err) {
            console.error("OTP send failed:", err);
            return {
                success: false,
                error: err.response?.data?.error || "Failed to send OTP"
            };
        }
    };

    const verifyOtp = async (email, otp) => {
        try {
            await api.post('/auth/verify-otp', { email, otp });
            return { success: true };
        } catch (err) {
            console.error("OTP verification failed:", err);
            return {
                success: false,
                error: err.response?.data?.error || "Invalid or expired OTP"
            };
        }
    };

    const register = async ({ email, password, fullName, orgName, role, otp, inviteToken, cloudPreference, invoiceOnly }) => {
        try {
            await api.post('/auth/register', { email, password, fullName, orgName, role, otp, inviteToken, cloudPreference, invoiceOnly });
            return { success: true };
        } catch (err) {
            console.error("Registration failed:", err);
            return {
                success: false,
                error: err.response?.data?.error || "Registration failed"
            };
        }
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                await api.post('/auth/logout', { refreshToken });
            } catch (err) {
                console.error("Failed to invalidate session on backend", err);
            }
        }
        // Auth tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');

        // Cloud cost cache
        localStorage.removeItem('ccm_azure_summary');
        localStorage.removeItem('ccm_aws_summary');
        localStorage.removeItem('ccm_btp_summary');
        localStorage.removeItem('ccm_gcp_summary');

        // Org onboarding flags (pattern: onboarded_cloud_<orgId>)
        Object.keys(localStorage)
          .filter(k => k.startsWith('onboarded_cloud_'))
          .forEach(k => localStorage.removeItem(k));

        sessionStorage.clear();
        setUser(null);
        setIsAuthenticated(false);
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch (err) {
            console.error("Failed to refresh user", err);
        }
    };

    const unlockAccount = async (email, token) => {
        try {
            await api.post('/auth/unlock-account', { email, token });
            return { success: true };
        } catch (err) {
            console.error("Unlock failed:", err);
            return {
                success: false,
                error: err.response?.data?.error || "Invalid or expired security token"
            };
        }
    };

    // Derived subscription flags — convenience helpers so every component
    // doesn't need to dig into user.features or user.cloudAccess directly.
    const invoiceOnly   = user?.invoiceOnly   ?? false;
    const cloudAccess   = user?.cloudAccess   ?? [];
    const features      = user?.features      ?? {
        budgets: true, smartAlerts: true, syncLogs: true,
        recommendations: true, cloudManagement: true, invoices: true,
        customerInvoicing: true,
    };
    const accountLimits = user?.accountLimits ?? { azure: 3, aws: 3, btp: 3 };

    const ctxValue = useMemo(
        () => ({
            user, loading, isAuthenticated,
            login, register, logout, sendOtp, verifyOtp, unlockAccount, refreshUser,
            // subscription-derived helpers
            invoiceOnly, cloudAccess, features, accountLimits,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [user, loading, isAuthenticated]
    );

    return (
        <AuthContext.Provider value={ctxValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
