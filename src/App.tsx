
// src/App.tsx
import BlocAnalyticsPage from './pages/BlocAnalyticsPage';

/**
 * The main application component.
 *
 * For now, we are directly rendering the BlocAnalyticsPage to verify
 * that the new chart component works correctly. In a later phase, this
* file will be updated to contain the application's router to handle
 * navigation between different pages (e.g., Entry Hub, Bloc Analytics).
 */
const App = () => {
  return <BlocAnalyticsPage />;
};

export default App;