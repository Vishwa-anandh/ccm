import api from './index';

/* ── Customers ─────────────────────────────────────────────── */

export const getCustomers = async () => {
    const { data } = await api.get('/billing/customers');
    return data;
};

export const createCustomer = async (customerData) => {
    const { data } = await api.post('/billing/customers', customerData);
    return data;
};

export const updateCustomer = async (id, customerData) => {
    const { data } = await api.patch(`/billing/customers/${id}`, customerData);
    return data;
};

/* ── Pricing Rules ─────────────────────────────────────────── */

export const getPricingRules = async () => {
    const { data } = await api.get('/billing/pricing-rules');
    return data;
};

export const createPricingRule = async (ruleData) => {
    const { data } = await api.post('/billing/pricing-rules', ruleData);
    return data;
};

export const updatePricingRule = async (id, ruleData) => {
    const { data } = await api.patch(`/billing/pricing-rules/${id}`, ruleData);
    return data;
};

export const deletePricingRule = async (id) => {
    const { data } = await api.delete(`/billing/pricing-rules/${id}`);
    return data;
};

/* ── Customer Invoices ─────────────────────────────────────── */

export const getInvoices = async () => {
    const { data } = await api.get('/billing/invoices');
    return data.data;
};

export const getInvoice = async (id) => {
    const { data } = await api.get(`/billing/invoices/${id}`);
    return data;
};

export const buildInvoice = async ({
    customerId, invoiceDate, dueDate, billingPeriodStart, billingPeriodEnd,
    customFields, columns, rows, taxPct,
}) => {
    const { data } = await api.post('/billing/invoices/build', {
        customerId, invoiceDate, dueDate, billingPeriodStart, billingPeriodEnd,
        customFields, columns, rows, taxPct,
    });
    return data;
};

export const updateInvoiceLines = async (id, { lines, taxPct }) => {
    const { data } = await api.patch(`/billing/invoices/${id}`, { lines, taxPct });
    return data;
};

export const approveInvoice = async (id) => {
    const { data } = await api.post(`/billing/invoices/${id}/approve`);
    return data;
};

export const publishInvoice = async (id) => {
    const { data } = await api.post(`/billing/invoices/${id}/publish`);
    return data;
};

export const payInvoice = async (id) => {
    const { data } = await api.post(`/billing/invoices/${id}/pay`);
    return data;
};
