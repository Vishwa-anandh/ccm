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

export const deleteCustomer = async (id) => {
    const { data } = await api.delete(`/billing/customers/${id}`);
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

/* ── Payment Terms ─────────────────────────────────────────── */

export const getPaymentTerms = async () => {
    const { data } = await api.get('/billing/payment-terms');
    return data;
};

export const createPaymentTerm = async (termData) => {
    const { data } = await api.post('/billing/payment-terms', termData);
    return data;
};

export const updatePaymentTerm = async (id, termData) => {
    const { data } = await api.patch(`/billing/payment-terms/${id}`, termData);
    return data;
};

export const deletePaymentTerm = async (id) => {
    const { data } = await api.delete(`/billing/payment-terms/${id}`);
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
    customerId, invoiceDate, paymentTermId,
    customFields, columns, rows, taxPct, overallAdjustmentPct, template,
}) => {
    const { data } = await api.post('/billing/invoices/build', {
        customerId, invoiceDate, paymentTermId,
        customFields, columns, rows, taxPct, overallAdjustmentPct, template,
    });
    return data;
};

export const updateInvoiceLines = async (id, { lines, taxPct, overallAdjustmentPct }) => {
    const { data } = await api.patch(`/billing/invoices/${id}`, { lines, taxPct, overallAdjustmentPct });
    return data;
};

export const payInvoice = async (id) => {
    const { data } = await api.post(`/billing/invoices/${id}/pay`);
    return data;
};
