
// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from 'react-router-dom';

import KeywordAnalysisPage from './pages/KeywordAnalysisPage';
import CountryAnalysisPage from './pages/CountryAnalysisPage';
import ReferenceTernaryChart from './components/prototypes/ReferenceTernaryChart';

/**
 * A simple page component to display the prototype chart.
 */
const PrototypePage = () => (
  <div className="p-4 sm:p-8 bg-multilat-surface min-h-screen">
    <div className="max-w-5xl mx-auto">
      <ReferenceTernaryChart />
    </div>
  </div>
);

/**
 * A simple navigation component for switching between pages during development.
 */
const AppNavigation = () => (
  <nav className="bg-gray-100 border-b border-gray-200">
    <div className="max-w-5xl mx-auto px-4 sm:px-8">
      <div className="flex items-center justify-start h-12">
        <div className="flex items-center space-x-4">
          <NavLink
            to="/keyword-analysis"
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-white text-teal-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`
            }
          >
            Keyword Analysis
          </NavLink>
          <NavLink
            to="/country-analysis"
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-white text-teal-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`
            }
          >
            Country Analysis
          </NavLink>
          <div className="border-l border-gray-300 h-6" />
          <NavLink
            to="/prototypes/ternary-chart"
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-yellow-100 text-yellow-800 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
              }`
            }
          >
            Prototype Chart
          </NavLink>
        </div>
      </div>
    </div>
  </nav>
);

/**
 * The main application component, which now includes routing.
 */
const App = () => {
  return (
    <Router>
      <AppNavigation />
      <Routes>
        <Route path="/keyword-analysis" element={<KeywordAnalysisPage />} />
        <Route path="/country-analysis" element={<CountryAnalysisPage />} />
        <Route path="/prototypes/ternary-chart" element={<PrototypePage />} />
        {/* Redirect the base URL to the keyword analysis page by default */}
        <Route path="/" element={<KeywordAnalysisPage />} />
      </Routes>
    </Router>
  );
};

export default App;