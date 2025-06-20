
// src/pages/CountryAnalysisPage.tsx
/**
 * @file CountryAnalysisPage.tsx
 * @summary Displays the country centroid ternary chart and its associated views (Table, Item).
 * This page visualizes how countries cluster based on their speech patterns relative
 * to three ideological poles.
 *
 * @architecture (Multi-view pattern from KeywordAnalysisPage)
 * - State Management: Manages 'activeView' and 'selectedCountry' state.
 * - UI Shell: Uses Shadcn-UI <Tabs> to switch between Chart, Table, and Item views.
 * - Interactivity: A single `handleSelect` function is triggered by clicks on the
 *   chart (via `handleNodeClick`) or table rows (via `onRowClick`) to populate
 *   the Item View.
 * - Data Display:
 *   - The 'Table View' uses the shared <DataTable> component.
 *   - The 'Item View' is a placeholder, ready for a future `useCountryDetails` hook.
 */
"use client";

import { useState, useMemo } from 'react';
import type { Data, Layout, PlotMouseEvent } from 'plotly.js';

import { useProcessedCountryData, FinalCountryCentroid } from '@/hooks/useProcessedCountryData';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  COUNTRY_LEGEND_GROUPINGS,
  MARKER_STYLES,
  TERNARY_AXES_CONFIG,
  TEXT_LABEL_STYLE,
} from '@/config/countryChartConfig';

import TernaryPlot from '@/graphs/TernaryPlot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// FIX: Corrected the import path for DataTable.
import { DataTable, ColumnDef } from '@/components/shared/DataTable';

interface CountryDataRow extends FinalCountryCentroid {
  id: string;
}

const CountryAnalysisPage = () => {
  const isMobile = useIsMobile();
  const [amplificationPower, setAmplificationPower] = useState(2.0);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  
  const [activeView, setActiveView] = useState('chart-view');
  const [selectedCountry, setSelectedCountry] = useState<CountryDataRow | null>(null);

  const { data: processedData, isLoading, isError, error } = useProcessedCountryData(amplificationPower, selectedCountries);

  const [sortKey, setSortKey] = useState<keyof CountryDataRow | null>('country_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const sortedCountryData = useMemo((): CountryDataRow[] => {
    const centroids = processedData?.countryCentroids || [];
    const tableData: CountryDataRow[] = centroids.map(c => ({...c, id: c.centroid_group_name}));

    if (!sortKey) return tableData;

    return [...tableData].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction;
      }
      return String(aValue).localeCompare(String(bValue)) * direction;
    });
  }, [processedData?.countryCentroids, sortKey, sortDirection]);

  const handleSort = (key: keyof CountryDataRow) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const handleSelect = (item: CountryDataRow) => {
    setSelectedCountry(item);
    setActiveView('item-view');
  };

  const handleNodeClick = (event: Readonly<PlotMouseEvent>) => {
    if (event.points && event.points.length > 0) {
      const pointData = event.points[0].customdata;
      if (pointData && Array.isArray(pointData)) {
        const clickedCountryName = pointData[0];
        const clickedCountry = sortedCountryData.find(
          c => c.country_name === clickedCountryName
        );
        if (clickedCountry) {
          handleSelect(clickedCountry);
        }
      }
    }
  };

  const plotLayout = useMemo((): Partial<Layout> => {
    const desktopTernaryConfig = { sum: 1, aaxis: { title: { text: TERNARY_AXES_CONFIG.a.title }, tickfont: { size: 10 } }, baxis: { title: { text: TERNARY_AXES_CONFIG.b.title }, tickfont: { size: 10 } }, caxis: { title: { text: TERNARY_AXES_CONFIG.c.title }, tickfont: { size: 10 } }, };
    const mobileTernaryConfig = { ...desktopTernaryConfig, aaxis: { ...desktopTernaryConfig.aaxis, title: { ...desktopTernaryConfig.aaxis.title, font: { size: 8 } }, tickfont: { size: 8 } }, baxis: { ...desktopTernaryConfig.baxis, title: { ...desktopTernaryConfig.baxis.title, font: { size: 8 } }, tickfont: { size: 8 } }, caxis: { ...desktopTernaryConfig.caxis, title: { ...desktopTernaryConfig.caxis.title, font: { size: 8 } }, tickfont: { size: 8 } }, };
    return { paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', font: { color: '#1a1d1d' }, ternary: isMobile ? mobileTernaryConfig : desktopTernaryConfig, height: isMobile ? 450 : 750, margin: isMobile ? { l: 40, r: 40, b: 150, t: 40 } : { l: 50, r: 50, b: 80, t: 80 }, showlegend: true, legend: isMobile ? { orientation: 'h', y: -0.2, yanchor: 'top', x: 0.5, xanchor: 'center', } : { yanchor: 'top', y: 1, xanchor: 'left', x: 0.01 }, };
  }, [isMobile]);

  const plotData = useMemo((): Data[] => {
    if (!processedData) return [];
    
    const countryCentroids = processedData.countryCentroids;
    const { groupCentroids } = processedData;
    const traceMode = showLabels ? 'markers+text' : 'markers';

    const traces: Data[] = [];
    if (groupCentroids.length > 0) { traces.push({ type: 'scatterternary', mode: 'markers+text', a: groupCentroids.map(c => c[TERNARY_AXES_CONFIG.a.prop]), b: groupCentroids.map(c => c[TERNARY_AXES_CONFIG.b.prop]), c: groupCentroids.map(c => c[TERNARY_AXES_CONFIG.c.prop]), text: groupCentroids.map(c => c.centroid_group_name), textfont: { ...TEXT_LABEL_STYLE.font, size: 10 }, textposition: 'top center', name: 'Main Group Centroids', marker: { ...MARKER_STYLES.groupCentroid, color: groupCentroids.map(c => c.marker_color || 'grey'), }, customdata: groupCentroids.map(c => [c.label, c.total_weight_for_group]), hovertemplate: "<b>%{customdata[0]}</b><br><br>" + "P(US-like): %{c:.3f}<br>" + "P(Russia-like): %{b:.3f}<br>" + "P(Middle-ground): %{a:.3f}<br>" + "Total Weight: %{customdata[1]:.0f}<br>" + "<extra></extra>", } as any); }
    const createCountryTrace = (countries: FinalCountryCentroid[], name: string, hoverSuffix = ""): Data => { return { type: 'scatterternary', mode: traceMode, a: countries.map(c => c[TERNARY_AXES_CONFIG.a.prop]), b: countries.map(c => c[TERNARY_AXES_CONFIG.b.prop]), c: countries.map(c => c[TERNARY_AXES_CONFIG.c.prop]), text: countries.map(c => c.centroid_group_name), textfont: TEXT_LABEL_STYLE.font, textposition: TEXT_LABEL_STYLE.position, name, marker: { ...MARKER_STYLES.countryCentroid, color: countries.map(c => c.marker_color_final), }, customdata: countries.map(c => [c.country_name, c.group ?? 'N/A', c.total_weight_for_group]), hovertemplate: `<b>%{customdata[0]}</b>${hoverSuffix}<br><br>` + "P(US-like): %{c:.3f}<br>" + "P(Russia-like): %{b:.3f}<br>" + "P(Middle-ground): %{a:.3f}<br>" + "Community: %{customdata[1]}<br>" + "Total Keyword Usage: %{customdata[2]:.0f}<br>" + "<extra></extra>", } as any; };
    const plottedCommunityIds = new Set<string>();
    COUNTRY_LEGEND_GROUPINGS.forEach(grouping => { const filteredCountries = countryCentroids.filter(c => c.group && grouping.communities.includes(c.group)); if (filteredCountries.length > 0) { traces.push(createCountryTrace(filteredCountries, grouping.name)); grouping.communities.forEach(id => plottedCommunityIds.add(id)); } });
    const uncategorizedCountries = countryCentroids.filter(c => c.group && !plottedCommunityIds.has(c.group));
    if (uncategorizedCountries.length > 0) { traces.push(createCountryTrace(uncategorizedCountries, 'Uncategorized Countries', ' (Uncategorized)')); }
    return traces;
  }, [processedData, showLabels]);
  
  const tableColumns: ColumnDef<CountryDataRow>[] = [
    { key: 'country_name', header: 'Country' },
    { key: 'total_weight_for_group', header: 'Total Keyword Usage' },
    // FIX: Added explicit 'number' type to 'val' parameter in render functions.
    { key: 'P_US_centroid', header: 'P(US-like)', render: (val: number) => val.toFixed(3) },
    { key: 'P_Russia_centroid', header: 'P(Russia-like)', render: (val: number) => val.toFixed(3) },
    { key: 'P_Middle_centroid', header: 'P(Middle-ground)', render: (val: number) => val.toFixed(3) },
    { key: 'group', header: 'Community' },
  ];

  const countryOptions = useMemo(() => {
    if (!processedData?.allCountries) return [];
    return processedData.allCountries.map(country => ({
      value: country.id,
      label: country.name,
      disabled: country.totalMentions === 0,
    }));
  }, [processedData?.allCountries]);

  const countText = useMemo(() => {
    const totalCount = processedData?.allCountries.length ?? 0;
    const displayedCount = sortedCountryData.length;
    const filterActive = selectedCountries.length > 0;
    return `Displaying ${displayedCount} of ${totalCount} total countries${filterActive ? ' (filtered)' : ''}.`;
  }, [processedData?.allCountries.length, sortedCountryData.length, selectedCountries.length]);

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList>
            <TabsTrigger value="chart-view">Chart View</TabsTrigger>
            <TabsTrigger value="table-view">Table View</TabsTrigger>
            <TabsTrigger value="item-view" disabled={!selectedCountry}>Item View</TabsTrigger>
          </TabsList>
          
          {activeView !== 'item-view' && (
            <Card className="mt-4">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-x-8 gap-y-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="country-filter" className="whitespace-nowrap shrink-0">Filter by Country</Label>
                  <MultiSelectCombobox
                    id="country-filter"
                    options={countryOptions}
                    value={selectedCountries}
                    onChange={setSelectedCountries}
                    placeholder="Select countries..."
                    className="w-full sm:w-[320px]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Label htmlFor="amplification-power" className="whitespace-nowrap">Amplification Power ({amplificationPower.toFixed(1)})</Label>
                  <Slider id="amplification-power" min={1} max={3} step={0.1} value={[amplificationPower]} onValueChange={([val]) => setAmplificationPower(val)} className="w-[150px]" />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox id="show-labels" checked={showLabels} onCheckedChange={(checked) => setShowLabels(Boolean(checked))} />
                  <Label htmlFor="show-labels" className="whitespace-nowrap">Show Labels</Label>
                </div>
              </CardContent>
            </Card>
          )}

          <TabsContent value="chart-view" className="mt-4">
            {isLoading ? <Skeleton className="w-full h-[800px]" /> :
             isError ? <div className="text-red-600 bg-red-50 p-4 rounded-md"><p><strong>Error:</strong> {error?.message}</p></div> :
             !processedData ? <p>No data available to display.</p> :
            (
              <Card>
                <CardHeader>
                  <CardTitle>'Centres' of Country and Voting Group Speech (Amp: {amplificationPower.toFixed(1)})</CardTitle>
                </CardHeader>
                <CardContent className="h-[520px] lg:h-[800px] flex flex-col p-2 sm:p-4">
                  <TernaryPlot data={plotData} layout={plotLayout} onClick={handleNodeClick} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="table-view" className="mt-4">
            <p className="mb-4 text-sm text-gray-600">
              {countText}
            </p>
            <DataTable
              data={sortedCountryData}
              columns={tableColumns}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSortChange={handleSort}
              onRowClick={handleSelect}
            />
          </TabsContent>

          <TabsContent value="item-view" className="mt-4">
            {selectedCountry ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedCountry.country_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Details for {selectedCountry.country_name} will be displayed here.</p>
                  <pre className="mt-4 p-4 bg-gray-100 rounded-md text-sm overflow-auto">
                    {JSON.stringify(selectedCountry, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg border">
                <p className="text-gray-600">Select a country from the Chart or Table view to see its details here.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CountryAnalysisPage;