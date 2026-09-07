import api from './index';

export const getGcpAccounts = () => api.get('/gcp/accounts');
export const createGcpAccount = (data) => api.post('/gcp/accounts', data);
export const deleteGcpAccount = (id) => api.delete(`/gcp/accounts/${id}`);

export const getGcpCosts = (accountId, forceRefresh = false) =>
    api.get('/gcp/costs', { params: { accountId, forceRefresh } });

export const getGcpServices = (accountId) =>
    api.get('/gcp/services', { params: { accountId } });

export const getGcpProjects = (accountId) =>
    api.get('/gcp/projects', { params: { accountId } });

export const getGcpLocations = (accountId) =>
    api.get('/gcp/locations', { params: { accountId } });

export const getGcpForecast = (accountId) =>
    api.get('/gcp/forecast', { params: { accountId } });

export const getGcpResourceTypes = (accountId) =>
    api.get('/gcp/resource-types', { params: { accountId } });

export const getGcpSummary = () => api.get('/gcp/summary');
export const getGcpTopServices = () => api.get('/gcp/top-services');
export const getGcpYearly = (accountId) =>
    api.get('/gcp/yearly', { params: { accountId } });

export const triggerGcpBackfill = (accountId) =>
    api.post('/gcp/backfill', { accountId });
