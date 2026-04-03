import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TechnicianDashboard from './pages/TechnicianDashboard';
import EstimateBuilder from './pages/EstimateBuilder';
import ProposalComparison from './pages/ProposalComparison';
import AddOns from './pages/AddOns';
import PricingComparison from './pages/PricingComparison';
import Customize from './pages/Customize';
import Terms from './pages/Terms';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/tech" replace />} />
        <Route path="/tech" element={<TechnicianDashboard />} />
        <Route path="/tech/estimate/new" element={<EstimateBuilder />} />
        <Route path="/tech/estimate/:id" element={<EstimateBuilder />} />
        <Route path="/proposal/:estimateId" element={<ProposalComparison />} />
        <Route path="/proposal/:estimateId/pricing" element={<PricingComparison />} />
        <Route path="/proposal/:estimateId/customize" element={<Customize />} />
        <Route path="/proposal/:estimateId/terms" element={<Terms />} />
        <Route path="/proposal/:estimateId/addons" element={<AddOns />} />
        <Route path="/proposal/:estimateId/checkout" element={<Checkout />} />
        <Route path="/proposal/:estimateId/confirm" element={<Confirmation />} />
      </Routes>
    </BrowserRouter>
  );
}
