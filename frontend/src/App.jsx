import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import PickCompany from './pages/PickCompany.jsx';
import ComingNext from './pages/ComingNext.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PickCompany />} />
        <Route path="/timeline/:ticker" element={<ComingNext screen="Timeline" />} />
        <Route path="/compare/:ticker" element={<ComingNext screen="Compare two windows" />} />
        <Route path="/prediction/:ticker" element={<ComingNext screen="Prediction and why" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
