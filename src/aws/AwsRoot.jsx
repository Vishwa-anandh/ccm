import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AccountProvider } from './context/AccountContext';
import OverallDashboard from './pages/OverallDashboard';
import AccountManager from './pages/AccountManager';
import DetailedDashboard from './pages/DetailedDashboard';

// This component acts as the entry point for the AWS section
// It provides the AccountContext and defines the sub-routes
function AwsRoot() {
    return (
        <AccountProvider>
            <Routes>
                {/* 
                  These paths are relative to the parent route "/aws/*" 
                  So path="/" matches "/aws/"
                  path="accounts" matches "/aws/accounts"
                */}
                <Route path="/" element={<OverallDashboard />} />
                <Route path="accounts" element={<AccountManager />} />
                <Route path="account/:accountId" element={<DetailedDashboard />} />
            </Routes>
        </AccountProvider>
    );
}

export default AwsRoot;
