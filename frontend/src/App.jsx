import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DelayProvider } from './lib/delay.jsx';
import PickCompany from './pages/PickCompany.jsx';
import Timeline from './pages/Timeline.jsx';
import ComingNext from './pages/ComingNext.jsx';

export default function App() {
  return (
    <DelayProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PickCompany />} />
          <Route path="/timeline/:ticker" element={<Timeline />} />
          <Route path="/compare/:ticker" element={<ComingNext screen="Compare two windows" />} />
          <Route path="/prediction/:ticker" element={<ComingNext screen="Prediction and why" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DelayProvider>
  );
}
