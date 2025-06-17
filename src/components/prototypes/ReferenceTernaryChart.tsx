
// src/components/prototypes/ReferenceTernaryChart.tsx
"use client";

import type { Data, Layout, PlotMouseEvent } from 'plotly.js';
import Plot from 'react-plotly.js';

// We only need the type definition now, not the calculation functions.
import { ItemWithSize } from '@/utils/ternaryDataProcessing'; 
import { calculateAmplifiedCoordinates } from '@/utils/ternaryCalculations';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReferenceTernaryChartProps {
  data: ItemWithSize[];
  onNodeClick: (item: any) => void;
}

/**
 * A self-contained, reference implementation of the Ternary Plot.
 * It now accepts data and an onNodeClick handler to be interactive.
 */
const ReferenceTernaryChart: React.FC<ReferenceTernaryChartProps> = ({ data, onNodeClick }) => {
  const isMobile = useIsMobile();

  // --- 1. Data Processing Pipeline ---
  const amplificationPower = 2;
  const amplifiedData = calculateAmplifiedCoordinates(data, amplificationPower);

  // --- 2. Responsive Layout & Marker Configuration ---
  const baseLayoutConfig: Partial<Layout> = {
    paper_bgcolor: '#f6f9f9',
    plot_bgcolor: '#f6f9f9',
    font: { color: '#1a1d1d' },
    ternary: { sum: 1 },
  };

  const desktopLayout: Partial<Layout> = {
    ...baseLayoutConfig,
    title: { text: 'Reference Ternary Plot (Mock Data)' },
    ternary: {
      ...baseLayoutConfig.ternary,
      aaxis: { title: { text: 'Middle-ground<br>share' }, tickfont: { size: 10 } },
      baxis: { title: { text: 'Russia-like-voting<br>share' }, tickfont: { size: 10 } },
      caxis: { title: { text: 'US-like-voting<br>share' }, tickfont: { size: 10 } },
    },
    height: 700,
    margin: { l: 50, r: 50, b: 50, t: 100 },
  };

  const mobileLayout: Partial<Layout> = {
    ...baseLayoutConfig,
    // Position the title slightly lower to make space for the colorbar above it.
    title: { text: 'Reference Ternary Plot', font: { size: 16 }, y: 0.93 },
    ternary: {
      ...baseLayoutConfig.ternary,
      aaxis: { title: { text: 'Middle-ground<br>share' }, tickfont: { size: 8 } },
      baxis: { title: { text: 'Russia-like-voting<br>share' }, tickfont: { size: 8 } },
      caxis: { title: { text: 'US-like-voting<br>share' }, tickfont: { size: 8 } },
    },
    height: 550,
    // Manually create a large top margin to reserve space for the colorbar and title.
    margin: { l: 20, r: 20, b: 40, t: 120 }, 
  };

  const baseMarkerConfig = {
    size: amplifiedData.map(d => d.size_px),
    color: amplifiedData.map(d => d.TotalMentions),
    colorscale: [[0, '#e0f2f1'], [1, '#437e84']],
  };

  const desktopColorBar = { title: { text: 'Total Mentions' }, thickness: 20, len: 0.75 };
  
  // Correctly position the horizontal colorbar within the manually created top margin.
  const mobileColorBar = { 
    title: { text: 'Mentions', side: 'top', font: { size: 10 } }, 
    thickness: 15, 
    len: 0.8, 
    x: 0.5, 
    y: 1, // Position at the very top of the plot area.
    xanchor: 'center',
    yanchor: 'top', // Anchor to the top.
    orientation: 'h',
    tickfont: { size: 9 } 
  };

  // --- 3. Data Transformation for Plotly ---
  const trace: Data = {
    type: 'scatterternary',
    mode: 'markers',
    a: amplifiedData.map(d => d.P_Middle_amp),
    b: amplifiedData.map(d => d.P_Russia_amp),
    c: amplifiedData.map(d => d.P_US_amp),
    text: amplifiedData.map(d => d.ngram),
    customdata: amplifiedData, // Pass the full data object
    hovertemplate: "<b>Ngram:</b> %{text}<br>" + "P_US (Original): %{customdata.P_US:.3f}<br>" + "P_Russia (Original): %{customdata.P_Russia:.3f}<br>" + "P_Middle (Original): %{customdata.P_Middle:.3f}<br>" + "TotalMentions: %{customdata.TotalMentions}<br>" + "<extra></extra>",
    marker: {
      ...baseMarkerConfig,
      colorbar: isMobile ? mobileColorBar : desktopColorBar,
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
  return (
    <Plot
      data={[trace]}
      layout={isMobile ? mobileLayout : desktopLayout}
      config={{ responsive: true, displaylogo: false }}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler={true}
      onClick={handleClick}
    />
  );
};

export default ReferenceTernaryChart;