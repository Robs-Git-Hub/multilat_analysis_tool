
// src/components/prototypes/ReferenceTernaryChart.tsx
"use client";

import type { Data, Layout } from 'plotly.js';

import TernaryPlot from '@/graphs/TernaryPlot';
import { MOCK_RAW_DATA } from '@/graphs/mockTernaryData';
import {
  calculateBaseTernaryAttributes,
  recalculateBubbleSizes,
} from '@/utils/ternaryDataProcessing';
import { calculateAmplifiedCoordinates } from '@/utils/ternaryCalculations';

/**
 * A self-contained, reference implementation of the Ternary Plot.
 * It uses mock data and shows a basic implementation of the data pipeline
 * for building a chart. This serves as a stable prototype.
 */
const ReferenceTernaryChart = () => {
  // --- 1. Data Processing Pipeline ---
  const attributeConfig = { us_count_col: 'US', russia_count_col: 'Russia', middle_count_col: 'Middle' };
  const bubbleSizeConfig = { minSize: 10, maxSize: 50, scalingPower: 1.5 };
  const amplificationPower = 2;

  const baseAttributeData = calculateBaseTernaryAttributes(MOCK_RAW_DATA, attributeConfig);
  const sizedData = recalculateBubbleSizes(baseAttributeData, bubbleSizeConfig);
  const amplifiedData = calculateAmplifiedCoordinates(sizedData, amplificationPower);

  // --- 2. Data Transformation for Plotly ---
  const keywordTrace: Data = {
    type: 'scatterternary',
    mode: 'markers',
    a: amplifiedData.map(d => d.P_Middle_amp),
    b: amplifiedData.map(d => d.P_Russia_amp),
    c: amplifiedData.map(d => d.P_US_amp),
    text: amplifiedData.map(d => d.ngram),
    customdata: amplifiedData.map(d => ({
      p_us: d.P_US,
      p_russia: d.P_Russia,
      p_middle: d.P_Middle,
      totalMentions: d.TotalMentions,
      size_px: d.size_px,
    })) as any[],
    hovertemplate: "<b>Ngram:</b> %{text}<br>" + "P_US (Original): %{customdata.p_us:.3f}<br>" + "P_Russia (Original): %{customdata.p_russia:.3f}<br>" + "P_Middle (Original): %{customdata.p_middle:.3f}<br>" + "TotalMentions: %{customdata.totalMentions}<br>" + "Size_px: %{customdata.size_px:.1f}" + "<extra></extra>",
    marker: {
      size: amplifiedData.map(d => d.size_px),
      color: amplifiedData.map(d => d.TotalMentions),
      colorscale: [[0, '#e0f2f1'], [1, '#437e84']],
      colorbar: { title: { text: 'Total Mentions' }, thickness: 20, len: 0.75 },
    },
  } as any;

  // --- 3. Layout Configuration for Plotly ---
  const keywordLayout: Partial<Layout> = {
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

  // --- 4. Render the Component ---
  return (
    <>
      <div className="mt-4 p-3 text-sm text-yellow-700 bg-yellow-50 rounded-lg border border-yellow-200">
        <span className="font-semibold">Prototype View:</span> This is a reference implementation using mock data. It is not connected to live data or filters.
      </div>
      <div className="mt-4">
        <TernaryPlot data={[keywordTrace]} layout={keywordLayout} />
      </div>
    </>
  );
};

export default ReferenceTernaryChart;