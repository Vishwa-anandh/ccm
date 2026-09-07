import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { BtpAccountProvider } from './context/BtpAccountContext';
import BtpOverallDashboard from './pages/BtpOverallDashboard';
import BtpAccountManager from './pages/BtpAccountManager';
import BtpCostPage from './pages/BtpCostPage';
import BtpServiceInstancesPage from './pages/BtpServiceInstancesPage';

function BtpRoot() {
    return (
        <BtpAccountProvider>
            <Routes>
                <Route path="/" element={<BtpOverallDashboard />} />
                <Route path="accounts" element={<BtpAccountManager />} />
                <Route path="account/:accountId" element={<BtpCostPage />} />
                <Route path="account/:accountId/subaccount/:subaccountId/service-instances" element={<BtpServiceInstancesPage />} />
            </Routes>
        </BtpAccountProvider>
    );
}

export default BtpRoot;
