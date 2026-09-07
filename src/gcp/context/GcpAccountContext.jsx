import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getGcpAccounts, createGcpAccount, deleteGcpAccount } from '../../api/gcpApi';

export const GcpAccountContext = createContext();

export const GcpAccountProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]);

    const fetchAccounts = async () => {
        try {
            const res = await getGcpAccounts();
            setAccounts(res.data);
        } catch (err) {
            console.error('Failed to fetch GCP accounts', err);
        }
    };

    useEffect(() => { fetchAccounts(); }, []);

    const addAccount = async (account) => {
        await createGcpAccount(account);
        localStorage.removeItem('ccm_gcp_summary');
        await fetchAccounts();
    };

    const removeAccount = async (id) => {
        await deleteGcpAccount(id);
        localStorage.removeItem('ccm_gcp_summary');
        setAccounts(accounts.filter(a => a.id !== id));
    };

    const getAccount = (id) => accounts.find(a => a.id === id);

    return (
        <GcpAccountContext.Provider value={{ accounts, addAccount, removeAccount, getAccount }}>
            {children}
        </GcpAccountContext.Provider>
    );
};

GcpAccountProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
