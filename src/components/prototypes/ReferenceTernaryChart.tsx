
// src/components/prototypes/ReferenceTernaryChart.tsx
"use client";

import type { Data, Layout, PlotMouseEvent } from 'plotly.js';
import Plot from 'react-plotly.js';

import { ItemWithSize } from '@/utils/ternaryDataProcessing';
import { calculateAmplifiedCoordinates } from '@/utils/ternaryCalculations';
import { useIsMobile } from '@/hooks/use-mobile';
import { HorizontalColorbar } from './HorizontalColorbar';

interface ReferenceTernaryChartProps {
  data: ItemWithSize[];
  onNodeClick: (item: any) => void;
}

/**
 * A self-contained, reference implementation of the Ternary Plot.
 * It now uses a custom React component for the title and colorbar on mobile
 * to ensure a robust and responsive layout.
 */
const ReferenceTernaryChart: React.FC<ReferenceTernaryChartProps> = ({ data, onNodeClick }) => {
  const isMobile = useIsMobile();

  // --- 1. Data Processing Pipeline ---
  const amplificationPower = 2;
  const amplifiedData = calculateAmplifiedCoordinates(data, amplificationPower);

  // Calculate min/max for our custom colorbar
  const mentionValues = amplifiedData.map(d => d.TotalMentions);
  const minMentions = Math.min(...mentionValues);
  const maxMentions = Math.max(...mentionValues);

  // --- 2. Responsive Layout & Marker Configuration ---
  const baseLayoutConfig: Partial<Layout> = {
    paper_bgcolor: '#f6f9f9',
    plot_bgcolor: '#f6f9f9',
    font: { color: '#1a1d1d' },
    ternary: {
      sum: 1,
      aaxis: { title: { text: 'Middle-ground<br>share' }, tickfont: { size: isMobile ? 8 : 10 } },
      baxis: { title: { text: 'Russia-like-voting<br>share' }, tickfont: { size: isMobile ? 8 : 10 } },
      caxis: { title: { text: 'US-like-voting<br>share' }, tickfont: { size: isMobile ? 8 : 10 } },
    },
  };

  const desktopLayout: Partial<Layout> = {
    ...baseLayoutConfig,
    title: { text: 'Reference Ternary Plot (Mock Data)' },
    height: 700,
    margin: { l: 50, r: 50, b: 50, t: 100 },
  };

  // On mobile, we remove the title and let our custom components handle it.
  // The height is reduced to remove excess whitespace above the plot.
  const mobileLayout: Partial<Layout> = {
    ...baseLayoutConfig,
    title: { text: '' }, // Disable Plotly's title
    height: 450, // REDUCED: This removes the large gap above the chart.
    margin: { l: 20, r: 20, b: 40, t: 20 },
  };

  const colorscale: [number, string][] = [[0, '#e0f2f1'], [1, '#437e84']];

  const baseMarkerConfig = {
    size: amplifiedData.map(d => d.size_px),
    color: amplifiedData.map(d => d.TotalMentions),
    colorscale: colorscale,
  };

  // --- 3. Data Transformation for Plotly ---
  const trace: Data = {
    type: 'scatterternary',
    mode: 'markers',
    a: amplifiedData.map(d => d.P_Middle_amp),
    b: amplifiedData.map(d => d.P_Russia_amp),
    c: amplifiedData.map(d => d.P_US_amp),
    text: amplifiedData.map(d => d.ngram),
    customdata: amplifiedData,
    hovertemplate: "<b>Ngram:</b> %{text}<br>" + "P_US (Original): %{customdata.P_US:.3f}<br>" + "P_Russia (Original): %{customdata.P_Russia:.3f}<br>" + "P_Middle (Original): %{customdata.P_Middle:.3f}<br>" + "TotalMentions: %{customdata.TotalMentions}<br>" + "<extra></extra>",
    marker: {
      ...baseMarkerConfig,
      showscale: !isMobile,
      colorbar: { title: { text: 'Total Mentions' }, thickness: 20, len: 0.75 },
    },
  } as any;

  const handleClick = (event: Readonly<PlotMouseEvent>) => {
    if (event.points && event.points.length > 0) {
      const clickedPoint = event.points[0];
      const customData = clickedPoint.customdata;
      onNodeClick(customData);
    }
  };

  // --- 4. Render the Component ---
  // On mobile, we wrap the chart with our custom title and colorbar.
  if (isMobile) {
    return (
      <div className="flex flex-col items-center w-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Reference Ternary Plot
        </h3>
        <Plot
          data={[trace]}
          layout={mobileLayout}
          config={{ responsive: true, displaylogo: false }}
          // Let the layout's height property control the size
          style={{ width: '100%' }}
          useResizeHandler={true}
          onClick={handleClick}
        />
        {/* MOVED: The colorbar is now rendered below the plot */}
        <div className="w-full mt-4">
          <HorizontalColorbar
            title="Total Mentions"
            min={minMentions}
            max={maxMentions}
            colorscale={colorscale}
          />
        </div>
      </div>
    );
  }

  // On desktop, we render the chart as before.
  return (
    <Plot
      data={[trace]}
      layout={desktopLayout}
      config={{ responsive: true, displaylogo: false }}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler={true}
      onClick={handleClick}
    />
  );
};

export default ReferenceTernaryChart;