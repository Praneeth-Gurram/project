import { Routes, Route, Navigate } from 'react-router-dom';
import XAIDashboard from './pages/XAIDashboard';
import './index.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/xai" replace />} />
      <Route path="/xai" element={<XAIDashboard />} />
    </Routes>
  );
}

export default App;
