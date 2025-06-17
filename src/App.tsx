
// src/App.tsx
import { useState, useMemo } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from 'react-router-dom';

import KeywordAnalysisPage from './pages/KeywordAnalysisPage';
import CountryAnalysisPage from './pages/CountryAnalysisPage';
import ReferenceTernaryChart from './components/prototypes/ReferenceTernaryChart';
import { MOCK_RAW_DATA } from './graphs/mockTernaryData';
import {
  calculateBaseTernaryAttributes,
  recalculateBubbleSizes,
  ItemWithSize,
} from './utils/ternaryDataProcessing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, ColumnDef } from './components/shared/DataTable';
import { FilterBar } from './components/shared/FilterBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchHelp } from './components/shared/SearchHelp';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { performSearch } from './utils/searchUtils';

type View = 'chart' | 'table' | 'item';

/**
 * The new, stateful page for testing our prototype UI ideas.
 */
const PrototypePage = () => {
  // --- 1. State Management ---
  const [view, setView] = useState<View>('chart');
  const [filterText, setFilterText] = useState('');
  const [selectedItem, setSelectedItem] = useState<ItemWithSize | null>(null);
  const [isPrecise, setIsPrecise] = useState(false);

  // --- 2. Data Processing (Memoized) ---
  const processedData = useMemo(() => {
    const attributeConfig = { us_count_col: 'US', russia_count_col: 'Russia', middle_count_col: 'Middle' };
    const bubbleSizeConfig = { minSize: 10, maxSize: 50, scalingPower: 1.5 };
    const baseData = calculateBaseTernaryAttributes(MOCK_RAW_DATA, attributeConfig);
    return recalculateBubbleSizes(baseData, bubbleSizeConfig);
  }, []);

  // --- 3. Filtering Logic (Refactored and Simplified) ---
  const filteredData = useMemo(() => {
    return performSearch(processedData, filterText, isPrecise);
  }, [processedData, filterText, isPrecise]);


  // --- 4. Event Handlers ---
  const handleNodeClick = (item: ItemWithSize) => {
    setSelectedItem(item);
    setView('item');
  };

  const handleViewChange = (newView: string) => {
    if (newView === 'item' && view !== 'item') {
      // If user clicks "Item View" tab directly, clear any selection
      setSelectedItem(null);
    }
    setView(newView as View);
  }

  // --- 5. View-Specific Configurations ---
  const tableColumns: ColumnDef<ItemWithSize>[] = [
    { key: 'ngram', header: 'N-gram' },
    { key: 'TotalMentions', header: 'Total Mentions' },
    { key: 'P_US', header: 'P(US)', render: (val) => (val as number).toFixed(3) },
    { key: 'P_Russia', header: 'P(Russia)', render: (val) => (val as number).toFixed(3) },
    { key: 'P_Middle', header: 'P(Middle)', render: (val) => (val as number).toFixed(3) },
  ];

  // --- 6. Render Logic ---
  return (
    <div className="p-4 sm:p-8 bg-multilat-surface min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
          <h2 className="text-lg font-semibold text-yellow-800">Prototype Control Panel</h2>
          <p className="text-sm text-yellow-700">This is a temporary notice area for development.</p>
        </div>

        <Tabs value={view} onValueChange={handleViewChange} className="w-full">
          {/* --- START: FINAL RESPONSIVE CONTROL PANEL LAYOUT --- */}
          {/* On mobile: flex-col. On desktop: grid with content-sized columns, aligned to the start. */}
          <div className="flex flex-col md:grid md:grid-cols-[auto_auto] md:justify-start md:items-center md:gap-4 mb-4">
            
            <TabsList>
              <TabsTrigger value="chart">Chart View</TabsTrigger>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="item">Item View</TabsTrigger>
            </TabsList>

            {view !== 'item' ? (
              // This container now wraps its items and uses gaps for spacing.
              <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
                {/* Wrapper ensures correct width on mobile vs desktop */}
                <div className="w-full md:w-auto md:flex-grow">
                  <FilterBar
                    filterText={filterText}
                    onFilterTextChange={setFilterText}
                    placeholder={isPrecise ? "Use !, |, ' for logic..." : "Fuzzy search by n-gram..."}
                  />
                </div>
                {/* Wrapper for the toggles to group them */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="precise-toggle" checked={isPrecise} onCheckedChange={(checked) => setIsPrecise(Boolean(checked))} />
                  <Label htmlFor="precise-toggle" className="text-sm font-medium whitespace-nowrap">Precise</Label>
                </div>
                <SearchHelp />
              </div>
            ) : (
              <div className="text-sm text-gray-600 text-center md:text-left">
                <p>Filtering is available in the <strong>Chart</strong> and <strong>Table</strong> views.</p>
              </div>
            )}
          </div>
          {/* --- END: FINAL RESPONSIVE CONTROL PANEL LAYOUT --- */}


          <TabsContent value="chart" className="mt-4">
            <ReferenceTernaryChart data={filteredData} onNodeClick={handleNodeClick} />
          </TabsContent>

          <TabsContent value="table" className="mt-4">
            <DataTable columns={tableColumns} data={filteredData} onRowClick={handleNodeClick} />
          </TabsContent>

          <TabsContent value="item" className="mt-4">
            {selectedItem ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedItem.ngram}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul>
                    {Object.entries(selectedItem).map(([key, value]) => (
                      <li key={key} className="text-sm py-1">
                        <span className="font-semibold">{key}:</span> {typeof value === 'number' ? value.toFixed(3) : String(value)}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg border">
                <p className="text-gray-600">Select an item from the Chart or Table view to see its details here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const AppNavigation = () => (
  <nav className="bg-gray-100 border-b border-gray-200">
    <div className="max-w-5xl mx-auto px-4 sm:px-8">
      <div className="flex items-center justify-start h-12">
        <div className="flex items-center space-x-4">
          <NavLink to="/keyword-analysis" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}>
            Keyword Analysis
          </NavLink>
          <NavLink to="/country-analysis" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}>
            Country Analysis
          </NavLink>
          <div className="border-l border-gray-300 h-6" />
          <NavLink to="/prototypes/ternary-chart" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-yellow-100 text-yellow-800 shadow-sm' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'}`}>
            Prototype Page
          </NavLink>
        </div>
      </div>
    </div>
  </nav>
);

const App = () => {
  return (
    <Router>
      <AppNavigation />
      <Routes>
        <Route path="/keyword-analysis" element={<KeywordAnalysisPage />} />
        <Route path="/country-analysis" element={<CountryAnalysisPage />} />
        <Route path="/prototypes/ternary-chart" element={<PrototypePage />} />
        <Route path="/" element={<KeywordAnalysisPage />} />
      </Routes>
    </Router>
  );
};

export default App;