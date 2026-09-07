import React, { createContext, useState, useEffect, useMemo } from 'react';
import { getBtpAccounts, createBtpAccount, deleteBtpAccount, renameBtpAccount } from '../../api/btpApi';

export const BtpAccountContext = createContext();

export const BtpAccountProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]);

    const fetchAccounts = async () => {
        try {
            const res = await getBtpAccounts();
            setAccounts(res.data);
        } catch (err) {
            console.error('Failed to fetch BTP accounts', err);
        }
    };

    useEffect(() => { fetchAccounts(); }, []);

    const addAccount = async (account) => {
        await createBtpAccount(account);
        localStorage.removeItem('ccm_btp_summary');
        await fetchAccounts();
    };

    const removeAccount = async (id) => {
        await deleteBtpAccount(id);
        localStorage.removeItem('ccm_btp_summary');
        setAccounts(accounts.filter(a => a.id !== id));
    };

    const renameAccount = async (id, name) => {
        await renameBtpAccount(id, name);
        setAccounts(accounts.map(a => a.id === id ? { ...a, name } : a));
    };

    const getAccount = (id) => accounts.find(a => a.id === id);

    const value = useMemo(
        () => ({ accounts, addAccount, removeAccount, renameAccount, getAccount }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [accounts]
    );

    return (
        <BtpAccountContext.Provider value={value}>
            {children}
        </BtpAccountContext.Provider>
    );
};

BtpAccountProvider.propTypes = {};
