
// src/graphs/TernaryPlot.tsx
"use client";

import Plot from 'react-plotly.js';
import type { Data, Layout, PlotMouseEvent } from 'plotly.js';

/**
 * A reusable, "dumb" presentation component for rendering a Ternary Plot.
 * It accepts Plotly's standard 'data' and 'layout' props and handles rendering.
 */
interface TernaryPlotProps {
  data: Data[];
  layout: Partial<Layout>;
  onClick?: (event: Readonly<PlotMouseEvent>) => void;
}

const TernaryPlot: React.FC<TernaryPlotProps> = ({ data, layout, onClick }) => {
  return (
    <Plot
      data={data}
      layout={layout}
      onClick={onClick}
      config={{
        responsive: true,
        displaylogo: false,
        displayModeBar: false,
      }}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler={true}
    />
  );
};

export default TernaryPlot;