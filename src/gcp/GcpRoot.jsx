import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { GcpAccountProvider } from './context/GcpAccountContext';
import GcpOverallDashboard from './pages/GcpOverallDashboard';
import GcpAccountManager from './pages/GcpAccountManager';
import GcpCostPage from './pages/GcpCostPage';

function GcpRoot() {
    return (
        <GcpAccountProvider>
            <Routes>
                <Route path="/" element={<GcpOverallDashboard />} />
                <Route path="accounts" element={<GcpAccountManager />} />
                <Route path="account/:accountId" element={<GcpCostPage />} />
            </Routes>
        </GcpAccountProvider>
    );
}

export default GcpRoot;
