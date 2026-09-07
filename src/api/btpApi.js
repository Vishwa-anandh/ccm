import api from './index';

export const getBtpAccounts = () => api.get('/btp/accounts');
export const createBtpAccount = (data) => api.post('/btp/accounts', data);
export const deleteBtpAccount = (id) => api.delete(`/btp/accounts/${id}`);
export const renameBtpAccount = (id, name) => api.patch(`/btp/accounts/${id}/name`, { name });

export const getBtpCosts = (accountId, forceRefresh = false) =>
    api.get('/btp/costs', { params: { accountId, forceRefresh } });

export const getBtpServices = (accountId) =>
    api.get('/btp/services', { params: { accountId } });

export const getBtpSubaccounts = (accountId) =>
    api.get('/btp/subaccounts', { params: { accountId } });

export const getBtpEnvironments = (accountId) =>
    api.get('/btp/environments', { params: { accountId } });

export const getBtpForecast = (accountId) =>
    api.get('/btp/forecast', { params: { accountId } });

export const getBtpSummary = () => api.get('/btp/summary');
export const getBtpTopServices = () => api.get('/btp/top-services');
export const getBtpYearly = (accountId) =>
    api.get('/btp/yearly', { params: { accountId } });

export const triggerBtpBackfill = (accountId) =>
    api.post('/btp/backfill', { accountId });

// ── Service Manager ────────────────────────────────────────────────────────────

export const getSmConfig = (btpAccountId, subaccountId) =>
    api.get('/btp/service-manager/config', { params: { btpAccountId, subaccountId } });

export const getSmConfigs = (btpAccountId) =>
    api.get('/btp/service-manager/configs', { params: { btpAccountId } });

export const saveSmConfig = (data) =>
    api.post('/btp/service-manager/config', data);

export const refreshSmInstances = (btpAccountId, subaccountId) =>
    api.post('/btp/service-manager/refresh', { btpAccountId, subaccountId });

/**
 * Open an SSE stream for a live SM refresh.
 * Returns an object with { cancel } so the caller can abort early.
 * onEvent(data) is called for each parsed SSE data line.
 */
export const refreshSmInstancesStream = (btpAccountId, subaccountId, onEvent) => {
    const token = localStorage.getItem('token');
    const base  = import.meta.env.VITE_API_URL ?? '';
    const url   = `${base}/btp/service-manager/refresh-stream?btpAccountId=${encodeURIComponent(btpAccountId)}&subaccountId=${encodeURIComponent(subaccountId)}`;

    const controller = new AbortController();

    fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
    }).then(async (res) => {
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            onEvent({ step: 'error', message: `HTTP ${res.status}: ${text || res.statusText}` });
            return;
        }
        const reader  = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer    = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // keep incomplete last line
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try { onEvent(JSON.parse(line.slice(6))); } catch { /* ignore malformed */ }
                }
            }
        }
    }).catch((err) => {
        if (err.name !== 'AbortError') onEvent({ step: 'error', message: err.message ?? 'Stream error' });
    });

    return { cancel: () => controller.abort() };
};

export const getSmInstances = (btpAccountId, subaccountId) =>
    api.get('/btp/service-manager/instances', { params: { btpAccountId, subaccountId } });
