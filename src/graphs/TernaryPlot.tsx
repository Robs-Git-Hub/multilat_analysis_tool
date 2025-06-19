
// src/graphs/TernaryPlot.tsx
"use client";

import Plot from 'react-plotly.js';
import type { Data, Layout } from 'plotly.js';

/**
 * A reusable, "dumb" presentation component for rendering a Ternary Plot.
 * It accepts Plotly's standard 'data' and 'layout' props and handles rendering.
 */
interface TernaryPlotProps {
  data: Data[];
  layout: Partial<Layout>;
}

const TernaryPlot: React.FC<TernaryPlotProps> = ({ data, layout }) => {
  return (
    <Plot
      data={data}
      layout={layout}
      config={{
        responsive: true,
        displaylogo: false,
        displayModeBar: false, // This line disables the Plotly toolbar
      }}
      style={{ width: '100%', height: '100%' }}
      useResizeHandler={true}
    />
  );
};

export default TernaryPlot;