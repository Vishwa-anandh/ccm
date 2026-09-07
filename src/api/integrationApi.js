import api from './index';

export const getIntegrations = async () => {
    const { data } = await api.get('/integrations');
    return data;
};

export const createIntegration = async (integrationData) => {
    const { data } = await api.post('/integrations', integrationData);
    return data;
};

export const updateIntegration = async (id, integrationData) => {
    const { data } = await api.put(`/integrations/${id}`, integrationData);
    return data;
};

export const deleteIntegration = async (id) => {
    const { data } = await api.delete(`/integrations/${id}`);
    return data;
};
