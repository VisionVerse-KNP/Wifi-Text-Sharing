import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LanRoomPage from './pages/LanRoomPage';
import PrivateRoomLanding from './pages/PrivateRoomLanding';
import PrivateRoomInvitePage from './pages/PrivateRoomInvitePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/wifi" element={<LanRoomPage />} />
      <Route path="/room" element={<PrivateRoomLanding />} />
      <Route path="/room/:roomId" element={<PrivateRoomInvitePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
