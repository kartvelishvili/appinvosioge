import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { Toaster } from '@/components/ui/toaster';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import AnalyticsPage from '@/pages/AnalyticsPage';
import Clients from '@/pages/Clients';
import ClientDetailsPage from '@/pages/ClientDetailsPage';
import Performers from '@/pages/Performers';
import PerformerDetailsPage from '@/pages/PerformerDetailsPage';
import Invoices from '@/pages/Invoices';
import InvoiceLibrary from '@/pages/InvoiceLibrary';
import CreateInvoice from '@/pages/CreateInvoice';
import InvoiceDetail from '@/pages/InvoiceDetail';
import PublicInvoice from '@/pages/PublicInvoice';
import OneTimeInvoices from '@/pages/OneTimeInvoices';
import OneTimeInvoiceDetailsPage from '@/pages/OneTimeInvoiceDetailsPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import DemoRequestPage from '@/pages/DemoRequestPage';

// Settings & Profile
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import SMSSettingsPage from '@/pages/SMSSettings';
import EmailSettingsPage from '@/pages/EmailSettings';
import TemplatesPage from '@/pages/Templates';
import DotsPage from '@/pages/DotsPage';

// Contracts
import Contracts from '@/pages/Contracts';
import CreateContract from '@/pages/CreateContract';
import ContractDetail from '@/pages/ContractDetail';
import ContractSigning from '@/pages/ContractSigning';

// Reports
import MonthlyRevenueReport from '@/pages/MonthlyRevenueReport';

// Legacy SMS Routes
import SMSSending from '@/pages/SMSSending';
import SMSLogs from '@/pages/SMSLogs';
import SMSReports from '@/pages/SMSReports';

// Legacy Email Routes
import EmailSending from '@/pages/EmailSending';
import EmailLogs from '@/pages/EmailLogs';
import EmailReports from '@/pages/EmailReports';

// Redirect component for old public links
const LegacyPublicInvoiceRedirect = () => {
    const { id } = useParams();
    return <Navigate to={`/invoices/${id}/public`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Helmet>
        <title>ინვოისო - ინვოისების მართვის სისტემა</title>
        <meta name="description" content="პროფესიონალური სისტემა ინვოისების და კლიენტების სამართავად" />
      </Helmet>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/demo-request" element={<DemoRequestPage />} />

          <Route path="/invoices/:id/public" element={<PublicInvoice />} />
          <Route path="/invoice/:id" element={<LegacyPublicInvoiceRedirect />} />
          
          <Route path="/contracts/:id/sign/:role" element={<ContractSigning />} />

          {/* Protected Main Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          
          {/* Clients Routes */}
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/clients/:id" element={<ProtectedRoute><ClientDetailsPage /></ProtectedRoute>} />
          
          <Route path="/performers" element={<ProtectedRoute><Performers /></ProtectedRoute>} />
          <Route path="/performers/:id" element={<ProtectedRoute><PerformerDetailsPage /></ProtectedRoute>} />

          <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><InvoiceLibrary /></ProtectedRoute>} />
          <Route path="/invoices/create" element={<ProtectedRoute><CreateInvoice /></ProtectedRoute>} />
          <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
          
          <Route path="/one-time-invoices" element={<ProtectedRoute><OneTimeInvoices /></ProtectedRoute>} />
          <Route path="/one-time-invoices/:id" element={<ProtectedRoute><OneTimeInvoiceDetailsPage /></ProtectedRoute>} />

          <Route path="/contracts" element={<ProtectedRoute><Contracts /></ProtectedRoute>} />
          <Route path="/contracts/create" element={<ProtectedRoute><CreateContract /></ProtectedRoute>} />
          <Route path="/contracts/:id" element={<ProtectedRoute><ContractDetail /></ProtectedRoute>} />
          
          <Route path="/reports/monthly" element={<ProtectedRoute><MonthlyRevenueReport /></ProtectedRoute>} />

          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>}>
            <Route index element={<Navigate to="sms" replace />} />
            <Route path="sms" element={<SMSSettingsPage />} />
            <Route path="email" element={<EmailSettingsPage />} />
            <Route path="templates" element={<TemplatesPage />} />
          </Route>
          
          <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
          
          <Route path="/dot" element={<ProtectedRoute><DotsPage /></ProtectedRoute>} />

          {/* Legacy Routes */}
          <Route path="/sms/send" element={<ProtectedRoute><SMSSending /></ProtectedRoute>} />
          <Route path="/sms/logs" element={<ProtectedRoute><SMSLogs /></ProtectedRoute>} />
          <Route path="/sms/reports" element={<ProtectedRoute><SMSReports /></ProtectedRoute>} />
          <Route path="/sms/settings" element={<Navigate to="/settings/sms" replace />} />
          <Route path="/sms/templates" element={<Navigate to="/settings/templates" replace />} />

          <Route path="/email/send" element={<ProtectedRoute><EmailSending /></ProtectedRoute>} />
          <Route path="/email/logs" element={<ProtectedRoute><EmailLogs /></ProtectedRoute>} />
          <Route path="/email/reports" element={<ProtectedRoute><EmailReports /></ProtectedRoute>} />
          <Route path="/email/settings" element={<Navigate to="/settings/email" replace />} />
          <Route path="/email/templates" element={<Navigate to="/settings/templates" replace />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

export default App;