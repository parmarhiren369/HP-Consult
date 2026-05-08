import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import DashboardPage from "./pages/DashboardPage";
import MediclaimPage from "./pages/MediclaimPage";
import LifeInsurancePage from "./pages/LifeInsurancePage";
import VehicleInsurancePage from "./pages/VehicleInsurancePage";
import RenewalsPage from "./pages/RenewalsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import TargetsPage from "./pages/TargetsPage";
import LeadsPage from "./pages/LeadsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <header className="h-14 flex items-center border-b bg-card/80 backdrop-blur-xl sticky top-0 z-10 px-4">
                <SidebarTrigger />
                <span className="ml-3 font-heading font-semibold text-sm text-muted-foreground">HP Consult</span>
              </header>
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/clients/mediclaim" element={<MediclaimPage />} />
                  <Route path="/clients/life" element={<LifeInsurancePage />} />
                  <Route path="/clients/vehicle" element={<VehicleInsurancePage />} />
                  <Route path="/renewals" element={<RenewalsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/whatsapp" element={<WhatsAppPage />} />
                  <Route path="/targets" element={<TargetsPage />} />
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
