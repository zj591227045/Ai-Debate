import { createBrowserRouter } from 'react-router-dom';
import ScoringTest from './pages/ScoringTest';

const router = createBrowserRouter([
  {
    path: '/scoring-test',
    Component: ScoringTest
  }
]);

export default router; 