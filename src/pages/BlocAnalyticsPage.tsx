
// src/pages/BlocAnalyticsPage.tsx
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
      // [CORRECTED] Using the orange/grey colorscale from the legacy prototype.
      colorscale: [[0, '#ffba00'], [1, '#6d6559']],
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
    title: {
      text: 'Relative Importance of N-grams by Voting Camp (Mock Data)',
    },
    ternary: {
      sum: 1,
      // [CORRECTED] Axis titles must be objects to satisfy Plotly's types.
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
    <div className="p-8 bg-multilat-surface min-h-screen">
      {/* [ADDED] Explanatory note about coordinate amplification */}
      <div className="max-w-4xl mx-auto p-3 mb-4 text-sm text-gray-700 bg-gray-100 rounded-lg border border-gray-200">
        <span className="font-semibold">Note:</span> For visual clarity, plotted points use amplified coordinates to better show affiliation. The hover-over pop-up always displays the original, true coordinates for data accuracy.
      </div>
      <div className="max-w-4xl mx-auto">
        <TernaryPlot data={[trace]} layout={layout} />
      </div>
    </div>
  );
};

export default BlocAnalyticsPage;