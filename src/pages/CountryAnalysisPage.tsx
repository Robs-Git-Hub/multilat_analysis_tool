
// src/pages/CountryAnalysisPage.tsx
/**
 * @file CountryAnalysisPage.tsx
 * @summary Displays the country centroid ternary chart. This page visualizes how
 * countries cluster based on their speech patterns relative to three ideological poles.
 *
 * @architecture
 * - Data Pipeline: Uses the `useProcessedCountryData` hook, which encapsulates all
 *   complex data fetching, processing, and calculation logic.
 *   @see {@link file://./src/hooks/useProcessedCountryData.ts}
 * - Configuration: All chart-specific settings (colors, labels, marker styles,
 *   legend groupings) are imported from a centralized config file, promoting
 *   maintainability and adhering to the DRY principle.
 *   @see {@link file://./src/config/countryChartConfig.ts}
 * - Rendering Strategy: Replicates the legacy Python application by constructing the
 *   chart from multiple, distinct `Scatterternary` traces. This is crucial for
 *   creating the specific, ordered legend required by the project specification.
 * - UI Layout: The overall page structure, including responsive handling for mobile,
 *   is modeled after the `KeywordAnalysisPage` for a consistent user experience.
 *   @see {@link file://./src/pages/KeywordAnalysisPage.tsx}
 */
"use client";

import { useState, useMemo } from 'react';
import type { Data, Layout } from 'plotly.js';

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


const CountryAnalysisPage = () => {
  const isMobile = useIsMobile();
  const [amplificationPower, setAmplificationPower] = useState(2.0);
  const [showLabels, setShowLabels] = useState(true);

  const { data: processedData, isLoading, isError, error } = useProcessedCountryData(amplificationPower);

  const plotLayout = useMemo((): Partial<Layout> => {
    const desktopTernaryConfig = {
      sum: 1,
      aaxis: { title: { text: TERNARY_AXES_CONFIG.a.title }, tickfont: { size: 10 } },
      baxis: { title: { text: TERNARY_AXES_CONFIG.b.title }, tickfont: { size: 10 } },
      caxis: { title: { text: TERNARY_AXES_CONFIG.c.title }, tickfont: { size: 10 } },
    };
    const mobileTernaryConfig = {
      ...desktopTernaryConfig,
      aaxis: { ...desktopTernaryConfig.aaxis, title: { ...desktopTernaryConfig.aaxis.title, font: { size: 8 } }, tickfont: { size: 8 } },
      baxis: { ...desktopTernaryConfig.baxis, title: { ...desktopTernaryConfig.baxis.title, font: { size: 8 } }, tickfont: { size: 8 } },
      caxis: { ...desktopTernaryConfig.caxis, title: { ...desktopTernaryConfig.caxis.title, font: { size: 8 } }, tickfont: { size: 8 } },
    };
    return {
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { color: '#1a1d1d' },
      ternary: isMobile ? mobileTernaryConfig : desktopTernaryConfig,
      height: isMobile ? 450 : 750,
      margin: isMobile ? { l: 40, r: 40, b: 40, t: 40 } : { l: 50, r: 50, b: 80, t: 80 },
      showlegend: true,
      legend: { yanchor: 'top', y: 1, xanchor: 'left', x: 0.01 },
    };
  }, [isMobile]);

  const plotData = useMemo((): Data[] => {
    if (!processedData) return [];

    const traces: Data[] = [];
    const { groupCentroids, countryCentroids } = processedData;
    const traceMode = showLabels ? 'markers+text' : 'markers';

    // --- Trace 1: Main Group Centroids ---
    if (groupCentroids.length > 0) {
      // FIX: Cast the entire trace object to `any` to resolve specific property errors.
      traces.push({
        type: 'scatterternary',
        mode: 'markers+text',
        a: groupCentroids.map(c => c[TERNARY_AXES_CONFIG.a.prop]),
        b: groupCentroids.map(c => c[TERNARY_AXES_CONFIG.b.prop]),
        c: groupCentroids.map(c => c[TERNARY_AXES_CONFIG.c.prop]),
        text: groupCentroids.map(c => c.centroid_group_name),
        textfont: { ...TEXT_LABEL_STYLE.font, size: 10 },
        textposition: 'top center',
        name: 'Main Group Centroids',
        marker: {
          ...MARKER_STYLES.groupCentroid,
          color: groupCentroids.map(c => c.marker_color || 'grey'),
        },
        customdata: groupCentroids.map(c => [c.label, c.total_weight_for_group]),
        hovertemplate: "<b>%{customdata[0]}</b><br><br>" +
                       "P(US-like): %{c:.3f}<br>" +
                       "P(Russia-like): %{b:.3f}<br>" +
                       "P(Middle-ground): %{a:.3f}<br>" +
                       "Total Weight: %{customdata[1]:.0f}<br>" +
                       "<extra></extra>",
      } as any);
    }

    // --- Helper function to create country traces ---
    const createCountryTrace = (countries: FinalCountryCentroid[], name: string, hoverSuffix = ""): Data => {
      // FIX: Cast the entire trace object to `any` to resolve specific property errors.
      return {
        type: 'scatterternary',
        mode: traceMode,
        a: countries.map(c => c[TERNARY_AXES_CONFIG.a.prop]),
        b: countries.map(c => c[TERNARY_AXES_CONFIG.b.prop]),
        c: countries.map(c => c[TERNARY_AXES_CONFIG.c.prop]),
        text: countries.map(c => c.centroid_group_name),
        textfont: TEXT_LABEL_STYLE.font,
        textposition: TEXT_LABEL_STYLE.position,
        name,
        marker: {
          ...MARKER_STYLES.countryCentroid,
          color: countries.map(c => c.marker_color_final),
        },
        customdata: countries.map(c => [c.country_name, c.group ?? 'N/A', c.total_weight_for_group]),
        hovertemplate: `<b>%{customdata[0]}</b>${hoverSuffix}<br><br>` +
                       "P(US-like): %{c:.3f}<br>" +
                       "P(Russia-like): %{b:.3f}<br>" +
                       "P(Middle-ground): %{a:.3f}<br>" +
                       "Community: %{customdata[1]}<br>" +
                       "Total Keyword Usage: %{customdata[2]:.0f}<br>" +
                       "<extra></extra>",
      } as any;
    };

    // --- Traces 2-5: Categorized Country Centroids ---
    const plottedCommunityIds = new Set<string>();
    COUNTRY_LEGEND_GROUPINGS.forEach(grouping => {
      const filteredCountries = countryCentroids.filter(c =>
        c.group && grouping.communities.includes(c.group)
      );
      if (filteredCountries.length > 0) {
        traces.push(createCountryTrace(filteredCountries, grouping.name));
        grouping.communities.forEach(id => plottedCommunityIds.add(id));
      }
    });

    // --- Trace 6: Uncategorized Countries ---
    const uncategorizedCountries = countryCentroids.filter(
      c => c.group && !plottedCommunityIds.has(c.group)
    );
    if (uncategorizedCountries.length > 0) {
      traces.push(createCountryTrace(uncategorizedCountries, 'Uncategorized Countries', ' (Uncategorized)'));
    }

    return traces;
  }, [processedData, showLabels]);

  const renderContent = () => {
    if (isLoading) return <Skeleton className="w-full h-[800px]" />;
    if (isError) return <div className="text-red-600 bg-red-50 p-4 rounded-md"><p><strong>Error:</strong> {error?.message}</p></div>;
    if (!processedData) return <p>No data available to display.</p>;

    return (
      <Card>
        <CardHeader>
          <CardTitle>'Centres' of Country and Voting Group Speech (Amp: {amplificationPower.toFixed(1)})</CardTitle>
        </CardHeader>
        <CardContent className="h-[520px] lg:h-[800px] flex flex-col p-2 sm:p-4">
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
              <Slider id="amplification-power" min={1} max={3} step={0.1} value={[amplificationPower]} onValueChange={([val]) => setAmplificationPower(val)} />
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