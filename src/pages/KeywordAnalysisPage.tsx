
// src/pages/KeywordAnalysisPage.tsx
"use client";

import { useMemo, useState } from 'react';
import type { Data, Layout } from 'plotly.js';

import { useConfigurableTernaryData } from '@/hooks/useConfigurableTernaryData';
import { TERNARY_CHART_CONFIGS } from '@/config/ternaryChartConfigs';

import { recalculateBubbleSizes } from '@/utils/ternaryDataProcessing';
import { useIsMobile } from '@/hooks/use-mobile';
import TernaryPlot from '@/graphs/TernaryPlot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';

const KeywordAnalysisPage = () => {
  const isMobile = useIsMobile();
  
  const chartConfig = TERNARY_CHART_CONFIGS['ngrams'];
  const { data: rawData, isLoading, isError, error } = useConfigurableTernaryData(chartConfig);

  const [searchTerm, setSearchTerm] = useState('');
  const [minNodeSize, setMinNodeSize] = useState(5);
  const [maxNodeSize, setMaxNodeSize] = useState(50);
  const [scalingPower, setScalingPower] = useState(2);

  const processedData = useMemo(() => {
    if (!rawData || !chartConfig) return [];

    const filteredData = rawData.filter(item =>
      String(item[chartConfig.labelCol]).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return recalculateBubbleSizes(filteredData, {
      minSize: minNodeSize,
      maxSize: maxNodeSize,
      scalingPower: scalingPower,
    });
  }, [rawData, chartConfig, searchTerm, minNodeSize, maxNodeSize, scalingPower]);
  
  const countText = useMemo(() => {
    if (isLoading || !rawData) return null;
    if (isError) return "Data could not be loaded.";

    const totalCount = rawData.length;
    const displayedCount = processedData.length;
    const searchActive = searchTerm.trim() !== '';

    return `Displaying ${displayedCount} of ${totalCount} total items${searchActive ? ' (filtered by search)' : ''}.`;
  }, [isLoading, isError, rawData, processedData, searchTerm]);


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
      height: isMobile ? 450 : 700,
      margin: isMobile ? { l: 40, r: 40, b: 40, t: 20 } : { l: 50, r: 50, b: 50, t: 50 },
    };
  }, [isMobile]);

  const plotData = useMemo((): Data[] => {
    if (!processedData || !chartConfig) return [];
    
    const trace: Data = {
      type: 'scatterternary',
      mode: 'markers',
      a: processedData.map(d => d.P_Middle),
      b: processedData.map(d => d.P_Russia),
      c: processedData.map(d => d.P_US),
      text: processedData.map(d => d[chartConfig.labelCol]),
      customdata: processedData,
      hovertemplate: "<b>Ngram:</b> %{text}<br>" + "P_US: %{c:.3f}<br>" + "P_Russia: %{b:.3f}<br>" + "P_Middle: %{a:.3f}<br>" + "Total Mentions: %{customdata.TotalMentions}<br>" + "<extra></extra>",
      marker: {
        size: processedData.map(d => d.size_px),
        color: processedData.map(d => d.TotalMentions),
        colorscale: [[0, '#e0f2f1'], [1, '#437e84']],
        showscale: !isMobile,
        colorbar: { title: { text: 'Total Mentions' }, thickness: 20, len: 0.75 },
      },
    } as any;
    return [trace];
  }, [processedData, isMobile, chartConfig]);

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="search">Search Ngram</Label>
                <Input id="search" placeholder="e.g. human rights" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Node Size Range (px)</Label>
                <div className="flex items-center gap-4">
                  <Input type="number" value={minNodeSize} onChange={(e) => setMinNodeSize(Number(e.target.value))} className="w-1/2" aria-label="Minimum node size" />
                  <Input type="number" value={maxNodeSize} onChange={(e) => setMaxNodeSize(Number(e.target.value))} className="w-1/2" aria-label="Maximum node size" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scaling-power">Scaling Power ({scalingPower.toFixed(1)})</Label>
                <Slider id="scaling-power" min={0.1} max={5} step={0.1} value={[scalingPower]} onValueChange={([val]) => setScalingPower(val)} />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Share of Keyword Usage by Group</CardTitle>
            </CardHeader>
            {/* THE FIX: Add a static height to the chart container to prevent resizing */}
            <CardContent className="h-[450px] lg:h-[700px]">
              <p className="mb-4 text-center text-sm text-gray-600 italic">
                {countText}
              </p>

              {isLoading && (<div className="w-full h-full"><Skeleton className="w-full h-full" /></div>)}
              {isError && (<div className="text-red-600 bg-red-50 p-4 rounded-md"><p><strong>Error:</strong> Failed to load data.</p><p className="text-sm">{error?.message}</p></div>)}
              {!isLoading && !isError && (<TernaryPlot data={plotData} layout={plotLayout} />)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KeywordAnalysisPage;