
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HorizontalColorbar } from '@/components/prototypes/HorizontalColorbar';

// Define colorscale once to be reused by Plotly and the custom colorbar
const TERNARY_COLORSACLE: [number, string][] = [[0, '#e0f2f1'], [1, '#437e84']];

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
  
  const { countText, mentionStats } = useMemo(() => {
    if (isLoading || !rawData) return { countText: null, mentionStats: { min: 0, max: 0 } };
    if (isError) return { countText: "Data could not be loaded.", mentionStats: { min: 0, max: 0 }};

    const totalCount = rawData.length;
    const displayedCount = processedData.length;
    const searchActive = searchTerm.trim() !== '';
    const text = `Displaying ${displayedCount} of ${totalCount} total items${searchActive ? ' (filtered by search)' : ''}.`;

    const mentionValues = processedData.map(d => d.TotalMentions);
    const stats = {
      min: Math.min(...mentionValues),
      max: Math.max(...mentionValues),
    };

    return { countText: text, mentionStats: stats };
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
      height: isMobile ? 450 : 750,
      // Use margins from prototype to ensure labels are not clipped
      margin: isMobile ? { l: 40, r: 40, b: 40, t: 20 } : { l: 50, r: 50, b: 80, t: 50 },
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
        colorscale: TERNARY_COLORSACLE,
        showscale: !isMobile, // Hide default legend on mobile
        colorbar: { title: { text: 'Total Mentions' }, thickness: 20, len: 0.75 },
      },
    } as any;
    return [trace];
  }, [processedData, isMobile, chartConfig]);

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        <Tabs defaultValue="chart-view" className="w-full">
          <TabsList>
            <TabsTrigger value="chart-view">Chart View</TabsTrigger>
            <TabsTrigger value="table-view" disabled>Table View</TabsTrigger>
            <TabsTrigger value="item-view" disabled>Item View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart-view" className="mt-4">
            <div className="flex flex-col gap-6">
              {/* Control Bar */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end sm:justify-start gap-x-6 gap-y-4">
                    <div className="flex-grow space-y-2 min-w-[250px]">
                      <Label htmlFor="search">Search Ngram</Label>
                      <Input id="search" placeholder="e.g. human rights" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Node Size Range (px)</Label>
                      <div className="flex items-center gap-2">
                        <Input type="number" value={minNodeSize} onChange={(e) => setMinNodeSize(Number(e.target.value))} className="w-20" aria-label="Minimum node size" />
                        <Input type="number" value={maxNodeSize} onChange={(e) => setMaxNodeSize(Number(e.target.value))} className="w-20" aria-label="Maximum node size" />
                      </div>
                    </div>
                    <div className="flex-grow space-y-2 min-w-[200px]">
                      <Label htmlFor="scaling-power">Scaling Power ({scalingPower.toFixed(1)})</Label>
                      <Slider id="scaling-power" min={0.1} max={5} step={0.1} value={[scalingPower]} onValueChange={([val]) => setScalingPower(val)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Chart Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Share of Keyword Usage by Group</CardTitle>
                </CardHeader>
                <CardContent className="h-[520px] lg:h-[800px] flex flex-col">
                  <p className="mb-4 text-sm text-gray-600">
                    {countText}
                  </p>

                  <div className="flex-grow">
                    {isLoading && (<div className="w-full h-full"><Skeleton className="w-full h-full" /></div>)}
                    {isError && (<div className="text-red-600 bg-red-50 p-4 rounded-md"><p><strong>Error:</strong> Failed to load data.</p><p className="text-sm">{error?.message}</p></div>)}
                    {!isLoading && !isError && (
                      <TernaryPlot 
                        data={plotData} 
                        layout={plotLayout}
                      />
                    )}
                  </div>
                  
                  {isMobile && !isLoading && !isError && (
                    <div className="w-full pt-4">
                      <HorizontalColorbar
                        title="Total Mentions"
                        min={mentionStats.min}
                        max={mentionStats.max}
                        colorscale={TERNARY_COLORSACLE}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Placeholder for Table View */}
          <TabsContent value="table-view">
             <Card><CardContent className="p-4">Table view is not yet implemented.</CardContent></Card>
          </TabsContent>
          {/* Placeholder for Item View */}
          <TabsContent value="item-view">
             <Card><CardContent className="p-4">Item view is not yet implemented.</CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default KeywordAnalysisPage;