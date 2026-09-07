import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AzureCostPage from './pages/AzureCostPage';
import AccountManager from './pages/AccountManager';
import AzureOverallDashboard from './pages/AzureOverallDashboard';

// This component preserves the original Azure App logic
function AzureRoot() {
    const location = useLocation();
    const autoSelectId   = location.state?.autoSelectId   ?? null;
    const autoSelectName = location.state?.autoSelectName ?? null;

    const [selectedAccount, setSelectedAccount] = useState(null);
    const [view, setView] = useState('dashboard'); // 'dashboard', 'accounts', 'cost'

    const handleSelectAccount = (account) => {
        setSelectedAccount(account);
        setView('cost');
    };

    const handleHome = () => {
        setView('dashboard');
        setSelectedAccount(null);
    };

    const handleManageAccounts = () => {
        setView('accounts');
    };

    return (
        <>
            {view === 'dashboard' && (
                <AzureOverallDashboard
                    onSelectAccount={handleSelectAccount}
                    onManageAccounts={handleManageAccounts}
                    autoSelectId={autoSelectId}
                    autoSelectName={autoSelectName}
                />
            )}

            {view === 'accounts' && (
                <AccountManager
                    onSelectAccount={handleSelectAccount}
                    onBack={handleHome}
                />
            )}

            {view === 'cost' && selectedAccount && (
                <AzureCostPage
                    account={selectedAccount}
                    onBack={handleHome}
                    onSwitchAccount={handleSelectAccount}
                />
            )}
        </>
    );
}

export default AzureRoot;
