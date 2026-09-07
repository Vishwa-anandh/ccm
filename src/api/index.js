import axios from 'axios';
import { fireToast } from '../components/ToastProvider';
import { DEMO_MODE, demoAdapter } from './demoBackend';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { 'Content-Type': 'application/json' },
    // No backend is running locally — route requests through an in-browser
    // mock instead of hitting the network. Flip DEMO_MODE off in
    // ./demoBackend.js once a real API is available.
    ...(DEMO_MODE ? { adapter: demoAdapter } : {}),
});

// ── Request: attach auth token ────────────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Map an Axios error to a human-readable toast message.
 * Returns null for 4xx errors that individual components already handle inline.
 */
function resolveToast(error, config) {
    // Network / no response
    if (!error.response) {
        return { message: 'Cannot reach the server. Check your connection and try again.', type: 'offline' };
    }

    const status    = error.response.status;
    const serverMsg = error.response.data?.error;

    switch (status) {
        // Session expired — only toast when NOT coming from auth endpoints (login forms handle it inline)
        case 401:
            if (config?.url?.includes('/auth/login') || config?.url?.includes('/auth/register')) return null;
            return { message: 'Your session has expired. Please log in again.', type: 'warning' };

        // Rate limited
        case 429:
            return { message: serverMsg || 'Too many requests — please wait a moment and try again.', type: 'warning' };

        // Server errors — component messages are often too generic; override with a clear toast
        case 500:
            return { message: 'An unexpected server error occurred. Please try again shortly.', type: 'error' };
        case 502:
        case 503:
        case 504:
            return { message: 'The server is temporarily unavailable. Please try again in a moment.', type: 'error' };

        // 4xx — handled inline by components; no duplicate toast
        default:
            return null;
    }
}

// ── Refresh Token State ─────────────────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers = [];
let isRedirectingToExpired = false;

function subscribeTokenRefresh(cb) {
    refreshSubscribers.push(cb);
}

function onRefreshed(error, token) {
    refreshSubscribers.forEach((cb) => cb(error, token));
    refreshSubscribers = [];
}

// ── Response: retry on network errors, toast on server/rate-limit errors ──────
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config ?? {};
        config._retryCount = config._retryCount ?? 0;

        // Re-attach token on retry
        const token = localStorage.getItem('token');
        if (token && config.headers) config.headers['Authorization'] = `Bearer ${token}`;

        // Retry on network errors (up to 3×, exponential backoff, never on auth routes)
        const isNetworkError = !error.response;
        if (isNetworkError && config._retryCount < 3 && !config.url?.includes('/auth/')) {
            config._retryCount += 1;
            const wait = 1000 * 2 ** (config._retryCount - 1); // 1s, 2s, 4s
            console.warn(`[API] Retry ${config._retryCount}/3 for ${config.url} in ${wait}ms`);
            await delay(wait);
            return api(config);
        }

        // Session expired handling
        if (error.response?.status === 401) {
            const msg = error.response.data?.error ?? '';
            
            // If the token explicitly expired, try to silently refresh
            if (msg === 'TokenExpired' && !config._retry) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        subscribeTokenRefresh((err, newToken) => {
                            if (err) return reject(err);
                            config.headers['Authorization'] = `Bearer ${newToken}`;
                            resolve(api(config));
                        });
                    });
                }

                config._retry = true;
                isRefreshing = true;

                try {
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (!refreshToken) throw new Error("No refresh token");

                    // Call refresh endpoint directly using axios to avoid interceptor loops
                    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh-token`, { refreshToken });
                    
                    const newAccessToken = res.data.token;
                    const newRefreshToken = res.data.refreshToken;

                    localStorage.setItem('token', newAccessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    isRefreshing = false;
                    onRefreshed(null, newAccessToken);

                    config.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return api(config);
                } catch (refreshErr) {
                    isRefreshing = false;
                    onRefreshed(refreshErr, null);

                    // Subscription expired — already redirected by the 403 handler, don't override with /login
                    if (refreshErr?.response?.data?.subscriptionExpired) {
                        return Promise.reject(refreshErr);
                    }

                    // Refresh failed, clear everything
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login?error=session_expired';
                    return Promise.reject(refreshErr);
                }
            } else if (msg.includes('Token is not valid') || msg.includes('authorization denied')) {
                // Hard 401 invalid token
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
            }
        }

        // Subscription expired — redirect to expired page (once; ignore duplicate concurrent responses)
        if (error.response?.status === 403 && error.response.data?.subscriptionExpired) {
            if (!isRedirectingToExpired && window.location.pathname !== '/subscription-expired') {
                isRedirectingToExpired = true;
                localStorage.removeItem('ccm_azure_summary');
                localStorage.removeItem('ccm_aws_summary');
                localStorage.removeItem('ccm_btp_summary');
                if (error.response.data?.subscription) {
                    sessionStorage.setItem('ccm_expired_sub', JSON.stringify(error.response.data.subscription));
                }
                window.location.href = '/subscription-expired';
            }
            throw error;
        }

        // Account deactivated — force logout
        if (error.response?.status === 403) {
            const msg = error.response.data?.error ?? '';
            if (msg.includes('deactivated') || msg.includes('locked')) {
                localStorage.removeItem('token');
                window.location.href = '/login?error=account_deactivated';
                throw error;
            }
        }

        // Fire global toast for errors that components won't surface clearly
        const toast = resolveToast(error, config);
        if (toast) {
            fireToast(toast.message, toast.type);
            if (error.response?.status === 401 && toast.message.includes('session has expired')) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('ccm_azure_summary');
                localStorage.removeItem('ccm_aws_summary');
                localStorage.removeItem('ccm_btp_summary');
                sessionStorage.clear();
                setTimeout(() => { window.location.href = '/login'; }, 1500);
            }
        }

        throw error;
    }
);

export default api;
