import api from './index';

export const getBudgets = async () => {
    const { data } = await api.get('/budgets');
    return data;
};

export const createBudget = async (budgetData) => {
    const { data } = await api.post('/budgets', budgetData);
    return data;
};

export const updateBudget = async (id, budgetData) => {
    const { data } = await api.put(`/budgets/${id}`, budgetData);
    return data;
};

export const deleteBudget = async (id) => {
    const { data } = await api.delete(`/budgets/${id}`);
    return data;
};
