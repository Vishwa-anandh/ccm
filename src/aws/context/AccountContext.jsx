import React, { createContext, useState, useEffect, useMemo } from 'react';
import api from '../../api';

export const AccountContext = createContext();

export const AccountProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]);
    const [accountsLoading, setAccountsLoading] = useState(true);

    const fetchAccounts = async () => {
        try {
            const res = await api.get('/aws/accounts');
            setAccounts(res.data);
        } catch (err) {
            console.error("Failed to fetch AWS accounts", err);
        } finally {
            setAccountsLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const addAccount = async (account) => {
        try {
            await api.post('/aws/accounts', account);
            localStorage.removeItem('ccm_aws_summary'); // force fresh fetch on next overview visit
            fetchAccounts();
        } catch (err) {
            console.error("Failed to add account", err);
            throw err;
        }
    };

    const removeAccount = async (id) => {
        try {
            await api.delete(`/aws/accounts/${id}`);
            localStorage.removeItem('ccm_aws_summary');
            setAccounts(accounts.filter(acc => acc.id !== id));
        } catch (err) {
            console.error("Failed to remove account", err);
        }
    };

    const renameAccount = async (id, name) => {
        await api.patch(`/aws/accounts/${id}/name`, { name });
        setAccounts(accounts.map(acc => acc.id === id ? { ...acc, name } : acc));
    };

    const getAccount = (id) => {
        return accounts.find(acc => acc.id === id);
    };

    const value = useMemo(
        () => ({ accounts, accountsLoading, addAccount, removeAccount, renameAccount, getAccount }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [accounts, accountsLoading]
    );

    return (
        <AccountContext.Provider value={value}>
            {children}
        </AccountContext.Provider>
    );
};
