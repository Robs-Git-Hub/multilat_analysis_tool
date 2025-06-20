
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
 * and includes a robust, well-documented axis configuration to prevent
 * label clipping and overlap on smaller screens.
 */
const ReferenceTernaryChart: React.FC<ReferenceTernaryChartProps> = ({ data, onNodeClick }) => {
  const isMobile = useIsMobile();

  // --- 1. Data Processing Pipeline ---
  const amplificationPower = 2;
  const amplifiedData = calculateAmplifiedCoordinates(data, amplificationPower);

  const mentionValues = amplifiedData.map(d => d.TotalMentions);
  const minMentions = Math.min(...mentionValues);
  const maxMentions = Math.max(...mentionValues);

  // --- 2. Responsive Layout & Marker Configuration ---

  const baseLayoutConfig: Partial<Layout> = {
    paper_bgcolor: '#f6f9f9',
    plot_bgcolor: '#f6f9f9',
    font: { color: '#1a1d1d' },
  };

  // --- Axis Configurations: A clear pattern for responsive labels ---

  const desktopTernaryConfig = {
    sum: 1,
    aaxis: {
      title: {
        // WORKAROUND: Add a trailing <br> tag to the title text. This forces
        // an extra line below the label, effectively increasing the top margin
        // and preventing the title from overlapping the plot grid.
        text: 'Middle-ground share<br>',
      },
      tickfont: { size: 10 },
    },
    baxis: { title: { text: 'Russia-like-voting<br>share' }, tickfont: { size: 10 } },
    caxis: { title: { text: 'US-like-voting<br>share' }, tickfont: { size: 10 } },
  };

  const mobileTernaryConfig = {
    sum: 1,
    aaxis: {
      title: {
        // Apply the same workaround for mobile to ensure consistency.
        text: 'Middle-ground share<br>',
        font: { size: 8 },
      },
      tickfont: { size: 8 },
    },
    baxis: {
      title: { text: 'Russia-like-<br>voting<br>share', font: { size: 8 } },
      tickfont: { size: 8 },
    },
    caxis: {
      title: { text: 'US-like-<br>voting<br>share', font: { size: 8 } },
      tickfont: { size: 8 },
    },
  };

  // --- Final Layout Objects ---

  const desktopLayout: Partial<Layout> = {
    ...baseLayoutConfig,
    title: { text: 'Reference Ternary Plot (Mock Data)' },
    ternary: desktopTernaryConfig,
    height: 700,
    margin: { l: 50, r: 50, b: 50, t: 100 }, // Reverted to original value
  };

  const mobileLayout: Partial<Layout> = {
    ...baseLayoutConfig,
    title: { text: '' }, // Custom title is rendered in React for mobile
    ternary: mobileTernaryConfig,
    height: 450,
    margin: {
      l: 40,
      r: 40,
      b: 40,
      t: 20, // Reverted to original value
    },
  };

  const colorscale: [number, string][] = [[0, '#c7d8da'], [1, '#36656a']];

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
      size: amplifiedData.map(d => d.size_px),
      color: amplifiedData.map(d => d.TotalMentions),
      colorscale: colorscale,
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
  if (isMobile) {
    return (
      <div className="flex flex-col items-center w-full">
        {/* Re-added bottom margin to the title as part of the reversion. */}
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Reference Ternary Plot
        </h3>
        <Plot
          data={[trace]}
          layout={mobileLayout}
          config={{ responsive: true, displaylogo: false }}
          style={{ width: '100%' }}
          useResizeHandler={true}
          onClick={handleClick}
        />
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