
// src/pages/BlocAnalyticsPage.tsx
"use client";

import type { Data, Layout } from 'plotly.js';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import TernaryPlot from '@/graphs/TernaryPlot';
import { MOCK_RAW_DATA } from '@/graphs/mockTernaryData';
import {
  calculateBaseTernaryAttributes,
  recalculateBubbleSizes,
} from '@/utils/ternaryDataProcessing';
import { calculateAmplifiedCoordinates } from '@/utils/ternaryCalculations';

/**
 * This is the main page component for Bloc Analytics.
 * It now uses a Tab interface to allow users to switch
 * between different types of ternary plot analysis.
 */
const BlocAnalyticsPage = () => {
  // --- 1. Data Processing Pipeline (for Keyword Analysis) ---
  const attributeConfig = { us_count_col: 'US', russia_count_col: 'Russia', middle_count_col: 'Middle' };
  const bubbleSizeConfig = { minSize: 10, maxSize: 50, scalingPower: 1.5 };
  const amplificationPower = 2;

  const baseAttributeData = calculateBaseTernaryAttributes(MOCK_RAW_DATA, attributeConfig);
  const sizedData = recalculateBubbleSizes(baseAttributeData, bubbleSizeConfig);
  const amplifiedData = calculateAmplifiedCoordinates(sizedData, amplificationPower);

  // --- 2. Data Transformation for Plotly (for Keyword Analysis) ---
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
      // [REVERTED] Colorscale reverted to the brand's primary teal theme for a cohesive look.
      colorscale: [[0, '#e0f2f1'], [1, '#437e84']],
      colorbar: { title: { text: 'Total Mentions' }, thickness: 20, len: 0.75 },
    },
  } as any;

  // --- 3. Layout Configuration for Plotly (for Keyword Analysis) ---
  const keywordLayout: Partial<Layout> = {
    title: { text: 'Relative Importance of N-grams by Voting Camp (Mock Data)' },
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
    <div className="p-4 sm:p-8 bg-multilat-surface min-h-screen">
      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="keyword_analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="keyword_analysis">Keyword Analysis</TabsTrigger>
            <TabsTrigger value="country_analysis">Country Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="keyword_analysis">
            <div className="mt-4 p-3 text-sm text-gray-700 bg-gray-100 rounded-lg border border-gray-200">
              <span className="font-semibold">Note:</span> For visual clarity, plotted points use amplified coordinates to better show affiliation. The hover-over pop-up always displays the original, true coordinates for data accuracy.
            </div>
            <div className="mt-4">
              <TernaryPlot data={[keywordTrace]} layout={keywordLayout} />
            </div>
          </TabsContent>

          <TabsContent value="country_analysis">
            <div className="mt-4 p-8 text-center text-gray-500 bg-gray-50 rounded-lg border">
              <p>The Country Position ternary plot will be implemented here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BlocAnalyticsPage;