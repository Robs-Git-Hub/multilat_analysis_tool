
// src/pages/CountryAnalysisPage.tsx
"use client";

import { useState, useMemo } from 'react'; // FIX: Added useMemo to the import list
import { useProcessedCountryData } from '@/hooks/useProcessedCountryData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import TernaryPlot from '@/graphs/TernaryPlot';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Data, Layout } from 'plotly.js';
import { Checkbox } from '@/components/ui/checkbox';

const CountryAnalysisPage = () => {
  const isMobile = useIsMobile();
  const [amplificationPower, setAmplificationPower] = useState(2.0);
  const [showLabels, setShowLabels] = useState(true);

  // The page now uses our clean, dedicated processing hook.
  const { data: processedCentroidData, isLoading, isError, error } = useProcessedCountryData(amplificationPower);

  const plotLayout = useMemo((): Partial<Layout> => {
    const desktopTernaryConfig = {
      sum: 1,
      aaxis: { title: { text: 'Middle-ground Share<br>' }, tickfont: { size: 10 } },
      baxis: { title: { text: 'Russia-like-voting<br>Share' }, tickfont: { size: 10 } },
      caxis: { title: { text: 'US-like-voting<br>Share' }, tickfont: { size: 10 } },
    };
    const mobileTernaryConfig = {
      ...desktopTernaryConfig,
      aaxis: { ...desktopTernaryConfig.aaxis, title: { ...desktopTernaryConfig.aaxis.title, font: { size: 8 } }, tickfont: { size: 8 } },
      baxis: { title: { text: 'Russia-like-<br>voting<br>Share', font: { size: 8 } }, tickfont: { size: 8 } },
      caxis: { title: { text: 'US-like-<br>voting<br>Share', font: { size: 8 } }, tickfont: { size: 8 } },
    };
    return {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: '#1a1d1d' },
      ternary: isMobile ? mobileTernaryConfig : desktopTernaryConfig,
      height: isMobile ? 450 : 750,
      margin: isMobile ? { l: 40, r: 40, b: 40, t: 20 } : { l: 50, r: 50, b: 80, t: 50 },
      showlegend: true,
      legend: { orientation: 'h', y: -0.15 },
    };
  }, [isMobile]);

  const plotData = useMemo((): Data[] => {
    if (!processedCentroidData) return [];

    const traces: Record<string, Partial<Data> & { x: number[], y: number[], z: number[], text: string[], customdata: any[] }> = {};

    for (const centroid of processedCentroidData) {
      const group = centroid.group || 'Other';
      if (!traces[group]) {
        traces[group] = {
          x: [], y: [], z: [], text: [], customdata: [],
          type: 'scatterternary',
          mode: showLabels ? 'text+markers' : 'markers',
          name: group,
          marker: { color: centroid.marker_color_final, size: 10 },
          textfont: { size: 10, color: 'black' },
          textposition: 'top center',
        };
      }
      traces[group].x.push(centroid.P_Middle_centroid);
      traces[group].y.push(centroid.P_Russia_centroid);
      traces[group].z.push(centroid.P_US_centroid);
      traces[group].text.push(centroid.centroid_group_name);
      traces[group].customdata.push(centroid);
    }
    
    return Object.values(traces).map(trace => ({
      ...trace,
      hovertemplate: "<b>%{customdata.country_name}</b><br>" +
                     "P(US-like): %{z:.3f}<br>" +
                     "P(Russia-like): %{y:.3f}<br>" +
                     "P(Middle-ground): %{x:.3f}<br>" +
                     "Community: %{customdata.group}<br>" +
                     "<extra></extra>",
    }));
  }, [processedCentroidData, showLabels]);

  const renderContent = () => {
    if (isLoading) return <Skeleton className="w-full h-[800px]" />;
    if (isError) return <div className="text-red-600 bg-red-50 p-4 rounded-md"><p><strong>Error:</strong> {error?.message}</p></div>;
    if (!processedCentroidData) return <p>No data available to display.</p>;

    return (
      <Card>
        <CardHeader>
          <CardTitle>'Centres' of Country and Voting Group Speech</CardTitle>
        </CardHeader>
        <CardContent className="h-[520px] lg:h-[800px] flex flex-col">
          <TernaryPlot data={plotData} layout={plotLayout} />
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-gray-900">Country Analysis</h1>
        
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-6 items-center">
            <div className="flex-grow space-y-2 min-w-[250px] w-full sm:w-auto">
              <Label htmlFor="amplification-power">Amplification Power ({amplificationPower.toFixed(1)})</Label>
              <Slider id="amplification-power" min={1} max={5} step={0.1} value={[amplificationPower]} onValueChange={([val]) => setAmplificationPower(val)} />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox id="show-labels" checked={showLabels} onCheckedChange={(checked) => setShowLabels(Boolean(checked))} />
              <Label htmlFor="show-labels">Show Labels</Label>
            </div>
          </CardContent>
        </Card>

        {renderContent()}
      </div>
    </div>
  );
};

export default CountryAnalysisPage;