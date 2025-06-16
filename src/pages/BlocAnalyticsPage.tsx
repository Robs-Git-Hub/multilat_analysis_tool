
// src/pages/BlocAnalyticsPage.tsx
"use client";

import type { Data, Layout } from 'plotly.js';

// Using the standard alias path. If this error persists after saving,
// please try restarting the VS Code TypeScript server by opening the
// command palette (Ctrl+Shift+P) and running "TypeScript: Restart TS Server".
import TernaryPlot from '@/graphs/TernaryPlot';

// Import mock data and the processing functions we'll use
import { MOCK_RAW_DATA } from '@/graphs/mockTernaryData';
import {
  calculateBaseTernaryAttributes,
  recalculateBubbleSizes,
} from '@/utils/ternaryDataProcessing';
import { calculateAmplifiedCoordinates } from '@/utils/ternaryCalculations';

/**
 * This is the main page component for Bloc Analytics.
 */
const BlocAnalyticsPage = () => {
  // --- 1. Data Processing Pipeline ---
  const attributeConfig = { us_count_col: 'US', russia_count_col: 'Russia', middle_count_col: 'Middle' };
  const bubbleSizeConfig = { minSize: 10, maxSize: 50, scalingPower: 1.5 };
  const amplificationPower = 2;

  const baseAttributeData = calculateBaseTernaryAttributes(MOCK_RAW_DATA, attributeConfig);
  const sizedData = recalculateBubbleSizes(baseAttributeData, bubbleSizeConfig);
  const amplifiedData = calculateAmplifiedCoordinates(sizedData, amplificationPower);

  // --- 2. Data Transformation for Plotly ---
  // [CORRECTED] We cast the trace object to `any` to resolve the strict typing issue.
  // This tells TypeScript that we are confident the object shape is correct for a
  // 'scatterternary' trace, even if the base types don't reflect it.
  const trace: Data = {
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

    hovertemplate:
      "<b>Ngram:</b> %{text}<br>" +
      "P_US (Original): %{customdata.p_us:.3f}<br>" +
      "P_Russia (Original): %{customdata.p_russia:.3f}<br>" +
      "P_Middle (Original): %{customdata.p_middle:.3f}<br>" +
      "TotalMentions: %{customdata.totalMentions}<br>" +
      "Size_px: %{customdata.size_px:.1f}" +
      "<extra></extra>",

    marker: {
      size: amplifiedData.map(d => d.size_px),
      color: amplifiedData.map(d => d.TotalMentions),
      colorscale: [[0, '#e0f2f1'], [1, '#437e84']],
      colorbar: {
        title: {
          text: 'Total Mentions',
        },
        thickness: 20,
        len: 0.75,
      },
    },
  } as any;

  // --- 3. Layout Configuration for Plotly ---
  const layout: Partial<Layout> = {
    // [CORRECTED] The main title must also be an object to satisfy the types.
    title: {
      text: 'Relative Importance of N-grams by Voting Camp (Mock Data)',
    },
    ternary: {
      sum: 1,
      aaxis: { title: 'Middle-ground emphasis', tickfont: { size: 10 } },
      baxis: { title: 'Russia-like voting emphasis', tickfont: { size: 10 } },
      caxis: { title: 'US-like voting emphasis', tickfont: { size: 10 } },
    },
    paper_bgcolor: '#f6f9f9',
    plot_bgcolor: '#f6f9f9',
    font: { color: '#1a1d1d' },
    height: 700,
  };

  // --- 4. Render the Component ---
  return (
    <div style={{ padding: '2rem' }}>
      <TernaryPlot data={[trace]} layout={layout} />
    </div>
  );
};

export default BlocAnalyticsPage;