import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import './i18n/config'; // Initialize i18n
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Vessels } from './pages/Vessels';
import { Ports } from './pages/Ports';
import { WorldPortIndex } from './pages/WorldPortIndex';
import { Companies } from './pages/Companies';
import { Chartering } from './pages/Chartering';
import CharteringDesk from './pages/CharteringDesk';
import { Voyages } from './pages/Voyages';
import { PortMap } from './pages/PortMap';
import { RouteCalculator } from './pages/RouteCalculator';
import { DADesk } from './pages/DADesk';
import { Laytime } from './pages/Laytime';
import { Features } from './pages/Features';
import { Reports } from './pages/Reports';
import { BillsOfLading } from './pages/BillsOfLading';
import { ActivityFeed } from './pages/ActivityFeed';
import { VoyageEstimate } from './pages/VoyageEstimate';
import { Claims } from './pages/Claims';
import { Mari8xLlm } from './pages/Mari8xLlm';
import { Bunkers } from './pages/Bunkers';
import { Crew } from './pages/Crew';
import { DocumentVault } from './pages/DocumentVault';
import { Alerts } from './pages/Alerts';
import { Compliance } from './pages/Compliance';
import { EblChain } from './pages/EblChain';
import { Contacts } from './pages/Contacts';
import { CargoEnquiries } from './pages/CargoEnquiries';
import { Invoices } from './pages/Invoices';
import { TimeCharters } from './pages/TimeCharters';
import { NoonReports } from './pages/NoonReports';
import { KYC } from './pages/KYC';
import { CargoCompatibility } from './pages/CargoCompatibility';
import { VesselHistory } from './pages/VesselHistory';
import { COAManagement } from './pages/COAManagement';
import { VesselPositions } from './pages/VesselPositions';
import { PortIntelligence } from './pages/PortIntelligence';
import { OpenTonnageList } from './pages/OpenTonnageList';
import { CargoEnquiryDetail } from './pages/CargoEnquiryDetail';
import { OperationsKPI } from './pages/OperationsKPI';
import { VoyageTimeline } from './pages/VoyageTimeline';
import { VoyageEstimateHistoryPage } from './pages/VoyageEstimateHistoryPage';
import { DelayAlerts } from './pages/DelayAlerts';
import { PortTariffs } from './pages/PortTariffs';
import { Permissions } from './pages/Permissions';
import { VendorManagement } from './pages/VendorManagement';
import { Analytics } from './pages/Analytics';
import { PortRestrictions } from './pages/PortRestrictions';
import { DocumentTemplates } from './pages/DocumentTemplates';
import { BunkerManagement } from './pages/BunkerManagement';
import { Emissions } from './pages/Emissions';
import { Geofencing } from './pages/Geofencing';
import { ApprovalWorkflows } from './pages/ApprovalWorkflows';
import { ExpiryTracker } from './pages/ExpiryTracker';
import { MentionsInbox } from './pages/MentionsInbox';
import { AgentDirectory } from './pages/AgentDirectory';
import { AgentAppointments } from './pages/AgentAppointments';
import PortAgencyPortal from './pages/PortAgencyPortal';
import { BunkerDisputes } from './pages/BunkerDisputes';
import { ClaimPackages } from './pages/ClaimPackages';
import { CostBenchmark } from './pages/CostBenchmark';
import { VesselCertificates } from './pages/VesselCertificates';
import { InsurancePolicies } from './pages/InsurancePolicies';
import { SOFManager } from './pages/SOFManager';
import { MarketIndices } from './pages/MarketIndices';
import { HirePayments } from './pages/HirePayments';
import { VesselInspections } from './pages/VesselInspections';
import { DocumentLinks } from './pages/DocumentLinks';
import { CashToMaster } from './pages/CashToMaster';
import { ECAZones } from './pages/ECAZones';
import { HighRiskAreas } from './pages/HighRiskAreas';
import { CriticalPathView } from './pages/CriticalPathView';
import { TeamManagement } from './pages/TeamManagement';
import { WeatherWarranty } from './pages/WeatherWarranty';
import { SaleListings } from './pages/SaleListings';
import { SNPDealRoom } from './pages/SNPDealRoom';
import { SNPValuation } from './pages/SNPValuation';
import SNPDesk from './pages/SNPDesk';
import { ClosingTracker } from './pages/ClosingTracker';
import { LetterOfCreditPage } from './pages/LetterOfCreditPage';
import { TradePayments } from './pages/TradePayments';
import { FXDashboard } from './pages/FXDashboard';
import { FreightDerivatives } from './pages/FreightDerivatives';
import { SanctionsScreening } from './pages/SanctionsScreening';
import { CRMPipeline } from './pages/CRMPipeline';
import { CustomerInsights } from './pages/CustomerInsights';
import { CarbonDashboard } from './pages/CarbonDashboard';
import { RevenueAnalytics } from './pages/RevenueAnalytics';
import { MarketOverview } from './pages/MarketOverview';
import { HRDashboard } from './pages/HRDashboard';
import { AttendanceLeave } from './pages/AttendanceLeave';
import { EmailInbox } from './pages/EmailInbox';
import { NotificationCenter } from './pages/NotificationCenter';
import AdvancedSearch from './pages/AdvancedSearch';
import KnowledgeBase from './pages/KnowledgeBase';
import AIDashboard from './pages/AIDashboard';
import PortCongestionDashboard from './pages/PortCongestionDashboard';
import FleetRouteVisualizer from './pages/FleetRouteVisualizer';
import VesselPortal from './pages/VesselPortal';
import FleetPortal from './pages/FleetPortal';
import PortDocuments from './pages/PortDocuments';
import NoonReportsEnhanced from './pages/NoonReportsEnhanced';
import OwnerROIDashboard from './pages/OwnerROIDashboard';
import AgentPortal from './pages/AgentPortal';
import AgentDashboard from './pages/AgentDashboard';
import ArrivalIntelligenceDetail from './pages/ArrivalIntelligenceDetail';
import Pricing from './pages/Pricing';
import Payment from './pages/Payment';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionManagement from './pages/SubscriptionManagement';
import BetaAgentSignup from './pages/BetaAgentSignup';
import BetaAgentOnboarding from './pages/BetaAgentOnboarding';
import BetaDashboard from './pages/admin/BetaDashboard';
import BetaAgentDetail from './pages/admin/BetaAgentDetail';
import BetaFeedbackDashboard from './pages/admin/BetaFeedbackDashboard';
import BetaAnalytics from './pages/admin/BetaAnalytics';
import BetaTrainingCenter from './pages/BetaTrainingCenter';
import ArticleViewer from './pages/ArticleViewer';
import BetaSuccessDashboard from './pages/admin/BetaSuccessDashboard';
import BetaKnowledgeBase from './pages/BetaKnowledgeBase';
import AISLiveDashboard from './pages/AISLiveDashboard';
import HybridAISMap from './pages/HybridAISMap';
import GFWEventsMap from './pages/GFWEventsMap';
import VesselJourneyTracker from './pages/VesselJourneyTracker';
import FleetDashboard from './pages/FleetDashboard';
import VesselAlertsPage from './pages/VesselAlertsPage';
import GeofencingPage from './pages/GeofencingPage';
import Mari8xLanding from './pages/Mari8xLanding';
import Mari8xTechnical from './pages/Mari8xTechnical';
import FlowCanvasPage from './pages/FlowCanvas/FlowCanvasPage';
import { FDADisputeResolution } from './pages/FDADisputeResolution';
import { CostOptimization } from './pages/CostOptimization';
import { BankReconciliation } from './pages/BankReconciliation';
import { ProtectingAgentManagement } from './pages/ProtectingAgentManagement';
import { TariffManagement } from './pages/TariffManagement';
import { useAuthStore } from './lib/stores/auth';
import { ToastProvider } from './components/Toast';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ToastProvider>
      <Suspense fallback={
        <div className="min-h-screen bg-maritime-950 flex items-center justify-center">
          <div className="text-maritime-400">Loading Mari8X...</div>
        </div>
      }>
        <Routes>
      <Route path="/" element={<Mari8xLanding />} />
      {/* Public Routes - No Authentication Required */}
      <Route path="/home" element={<Mari8xLanding />} />
      <Route path="/mari8x" element={<Mari8xLanding />} />
      <Route path="/mari8x-technical" element={<Mari8xTechnical />} />
      <Route path="/technical" element={<Mari8xTechnical />} />
      <Route path="/login" element={<Login />} />
      <Route path="/beta/signup" element={<BetaAgentSignup />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/vessels" element={<Vessels />} />
        <Route path="/ports" element={<Ports />} />
        <Route path="/world-port-index" element={<WorldPortIndex />} />
        <Route path="/port-map" element={<PortMap />} />
        <Route path="/route-calculator" element={<RouteCalculator />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/chartering" element={<Chartering />} />
        <Route path="/chartering-desk" element={<CharteringDesk />} />
        <Route path="/voyages" element={<Voyages />} />
        <Route path="/da-desk" element={<DADesk />} />
        <Route path="/fda-disputes" element={<FDADisputeResolution />} />
        <Route path="/cost-optimization" element={<CostOptimization />} />
        <Route path="/bank-reconciliation" element={<BankReconciliation />} />
        <Route path="/protecting-agents" element={<ProtectingAgentManagement />} />
        <Route path="/tariff-management" element={<TariffManagement />} />
        <Route path="/laytime" element={<Laytime />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/bills-of-lading" element={<BillsOfLading />} />
        <Route path="/activity" element={<ActivityFeed />} />
        <Route path="/voyage-estimate" element={<VoyageEstimate />} />
        <Route path="/claims" element={<Claims />} />
        <Route path="/mari8x-llm" element={<Mari8xLlm />} />
        <Route path="/ai-engine" element={<AIDashboard />} />
        <Route path="/bunkers" element={<Bunkers />} />
        <Route path="/crew" element={<Crew />} />
        <Route path="/documents" element={<DocumentVault />} />
        <Route path="/advanced-search" element={<AdvancedSearch />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/ebl-chain" element={<EblChain />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/cargo-enquiries" element={<CargoEnquiries />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/time-charters" element={<TimeCharters />} />
        <Route path="/noon-reports" element={<NoonReports />} />
        <Route path="/kyc" element={<KYC />} />
        <Route path="/cargo-compatibility" element={<CargoCompatibility />} />
        <Route path="/vessel-history" element={<VesselHistory />} />
        <Route path="/coa" element={<COAManagement />} />
        <Route path="/vessel-positions" element={<VesselPositions />} />
        <Route path="/port-intelligence" element={<PortIntelligence />} />
        <Route path="/open-tonnage" element={<OpenTonnageList />} />
        <Route path="/cargo-enquiries/:id" element={<CargoEnquiryDetail />} />
        <Route path="/operations-kpi" element={<OperationsKPI />} />
        <Route path="/voyage-timeline/:id" element={<VoyageTimeline />} />
        <Route path="/ve-history" element={<VoyageEstimateHistoryPage />} />
        <Route path="/delay-alerts" element={<DelayAlerts />} />
        <Route path="/port-tariffs" element={<PortTariffs />} />
        <Route path="/permissions" element={<Permissions />} />
        <Route path="/vendor-management" element={<VendorManagement />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/port-restrictions" element={<PortRestrictions />} />
        <Route path="/port-congestion" element={<PortCongestionDashboard />} />
        <Route path="/fleet-routes" element={<FleetRouteVisualizer />} />
        <Route path="/vessel-portal" element={<VesselPortal />} />
        <Route path="/fleet-portal" element={<FleetPortal />} />
        <Route path="/port-documents" element={<PortDocuments />} />
        <Route path="/noon-reports-enhanced" element={<NoonReportsEnhanced />} />
        <Route path="/owner-roi-dashboard" element={<OwnerROIDashboard />} />
        <Route path="/agent-portal" element={<AgentPortal />} />
        <Route path="/agent/dashboard" element={<AgentDashboard />} />
        <Route path="/agent/arrivals/:arrivalId" element={<ArrivalIntelligenceDetail />} />
        <Route path="/document-templates" element={<DocumentTemplates />} />
        <Route path="/bunker-management" element={<BunkerManagement />} />
        <Route path="/emissions" element={<Emissions />} />
        <Route path="/geofencing" element={<Geofencing />} />
        <Route path="/approvals" element={<ApprovalWorkflows />} />
        <Route path="/expiry-tracker" element={<ExpiryTracker />} />
        <Route path="/mentions" element={<MentionsInbox />} />
        <Route path="/agent-directory" element={<AgentDirectory />} />
        <Route path="/agent-appointments" element={<AgentAppointments />} />
        <Route path="/port-agency-portal" element={<PortAgencyPortal />} />
        <Route path="/bunker-disputes" element={<BunkerDisputes />} />
        <Route path="/claim-packages" element={<ClaimPackages />} />
        <Route path="/cost-benchmarks" element={<CostBenchmark />} />
        <Route path="/vessel-certificates" element={<VesselCertificates />} />
        <Route path="/insurance" element={<InsurancePolicies />} />
        <Route path="/sof-manager" element={<SOFManager />} />
        <Route path="/market-indices" element={<MarketIndices />} />
        <Route path="/hire-payments" element={<HirePayments />} />
        <Route path="/vessel-inspections" element={<VesselInspections />} />
        <Route path="/document-links" element={<DocumentLinks />} />
        <Route path="/cash-to-master" element={<CashToMaster />} />
        <Route path="/eca-zones" element={<ECAZones />} />
        <Route path="/high-risk-areas" element={<HighRiskAreas />} />
        <Route path="/critical-path" element={<CriticalPathView />} />
        <Route path="/team" element={<TeamManagement />} />
        <Route path="/weather-warranty" element={<WeatherWarranty />} />
        <Route path="/sale-listings" element={<SaleListings />} />
        <Route path="/snp-desk" element={<SNPDesk />} />
        <Route path="/snp-deals" element={<SNPDealRoom />} />
        <Route path="/snp-valuation" element={<SNPValuation />} />
        <Route path="/closing-tracker" element={<ClosingTracker />} />
        <Route path="/letters-of-credit" element={<LetterOfCreditPage />} />
        <Route path="/trade-payments" element={<TradePayments />} />
        <Route path="/fx-dashboard" element={<FXDashboard />} />
        <Route path="/freight-derivatives" element={<FreightDerivatives />} />
        <Route path="/sanctions" element={<SanctionsScreening />} />
        <Route path="/crm-pipeline" element={<CRMPipeline />} />
        <Route path="/customer-insights" element={<CustomerInsights />} />
        <Route path="/carbon" element={<CarbonDashboard />} />
        <Route path="/revenue-analytics" element={<RevenueAnalytics />} />
        <Route path="/market-overview" element={<MarketOverview />} />
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="/attendance" element={<AttendanceLeave />} />
        <Route path="/email-inbox" element={<EmailInbox />} />
        <Route path="/notification-center" element={<NotificationCenter />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/subscription-success" element={<SubscriptionSuccess />} />
        <Route path="/subscription-management" element={<SubscriptionManagement />} />
        <Route path="/beta/onboarding" element={<BetaAgentOnboarding />} />
        <Route path="/admin/beta" element={<BetaDashboard />} />
        <Route path="/admin/beta/agents/:agentId" element={<BetaAgentDetail />} />
        <Route path="/admin/beta/feedback" element={<BetaFeedbackDashboard />} />
        <Route path="/admin/beta/analytics" element={<BetaAnalytics />} />
        <Route path="/admin/beta/success" element={<BetaSuccessDashboard />} />
        <Route path="/training" element={<BetaTrainingCenter />} />
        <Route path="/training/article/:slug" element={<ArticleViewer />} />
        <Route path="/beta/knowledge-base" element={<BetaKnowledgeBase />} />
        <Route path="/ais/live" element={<AISLiveDashboard />} />
        <Route path="/ais/hybrid-map" element={<HybridAISMap />} />
        <Route path="/ais/gfw-events" element={<GFWEventsMap />} />
        <Route path="/ais/vessel-journey" element={<VesselJourneyTracker />} />
        <Route path="/ais/fleet-dashboard" element={<FleetDashboard />} />
        <Route path="/ais/alerts" element={<VesselAlertsPage />} />
        <Route path="/ais/geofencing" element={<GeofencingPage />} />
        <Route path="/flow-canvas" element={<FlowCanvasPage />} />
      </Route>
    </Routes>
      </Suspense>
    </ToastProvider>
  );
}
