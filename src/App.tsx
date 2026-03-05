import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import ClinicPage from "./pages/ClinicPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import ServicesPage from "./pages/dashboard/ServicesPage";
import HoursPage from "./pages/dashboard/HoursPage";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import FinancePage from "./pages/dashboard/FinancePage";
import ProfessionalsPage from "./pages/dashboard/ProfessionalsPage";
import CommissionsPage from "./pages/dashboard/CommissionsPage";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Páginas Institucionais e Autenticação */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Rotas Agrupadas do Dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="professionals" element={<ProfessionalsPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="commissions" element={<CommissionsPage />} />
            <Route path="hours" element={<HoursPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 🚀 URL Profissional: conectnew.com.br/nome-da-empresa */}
          {/* Esta rota dinâmica deve vir por último antes do 404 */}
          <Route path="/:slug" element={<ClinicPage />} />

          {/* Fallback 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;