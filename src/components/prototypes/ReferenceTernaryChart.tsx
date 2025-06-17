
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
  console.log('[Verification] Is mobile view:', isMobile);

  // --- 1. Data Processing Pipeline ---
  const amplificationPower = 2;
  const amplifiedData = calculateAmplifiedCoordinates(data, amplificationPower);

  // --- 2. Data Transformation for Plotly ---
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
      size: amplifiedData.map(d => d.size_px),
      color: amplifiedData.map(d => d.TotalMentions),
      colorscale: [[0, '#e0f2f1'], [1, '#437e84']],
      colorbar: { title: { text: 'Total Mentions' }, thickness: 20, len: 0.75 },
    },
  } as any;

  // --- 3. Layout Configuration for Plotly ---
  const layout: Partial<Layout> = {
    title: { text: 'Reference Ternary Plot (Mock Data)' },
    ternary: {
      sum: 1,
      aaxis: { title: { text: 'Middle-ground emphasis' }, tickfont: { size: 10 } },
      baxis: { title: { text: 'Russia-like voting emphasis' }, tickfont: { size: 10 } },
      caxis: { title: { text: 'US-like voting emphasis' }, tickfont: { size: 10 } },
    },
    paper_bgcolor: '#f6f9f9',
    plot_bgcolor: '#f6f9f9',
    font: { color: '#1a1d1d' },
    height: 700,
  };

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
      layout={layout}
      config={{ responsive: true, displaylogo: false }}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler={true}
      onClick={handleClick}
    />
  );
};

export default ReferenceTernaryChart;