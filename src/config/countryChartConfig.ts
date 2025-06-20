
// src/config/countryChartConfig.ts

/**
 * @file countryChartConfig.ts
 * @summary Centralized configuration for the Country Centroid Analysis Chart.
 * This file contains all the "magic values" and styling definitions needed to
 * replicate the legacy Python chart's appearance and behavior, ensuring that
 * the page components remain clean and focused on rendering logic.
 */

import type { GroupDefinition } from '@/utils/ternaryCalculations';

// Replicates CENTROID_GROUP_DEFINITIONS from legacy/app.py
export const MAIN_GROUP_CENTROID_DEFINITIONS: Record<string, GroupDefinition> = {
  US_Focus: { 
    weight_col_name: 'count_A', 
    label: 'US Centroid (Amplified)', 
    marker_symbol: 'diamond', 
    marker_color: 'blue' 
  },
  Russia_Focus: { 
    weight_col_name: 'count_G', 
    label: 'Russia Centroid (Amplified)', 
    marker_symbol: 'diamond', 
    marker_color: 'red' 
  },
  Middle_Focus: { 
    weight_col_name: 'count_BCDE', 
    label: 'Middle Ground Centroid (Amplified)', 
    marker_symbol: 'diamond', 
    marker_color: 'green' 
  },
};

// Replicates the community-to-legend mapping from legacy/centroid_plot_page.py
export const COUNTRY_LEGEND_GROUPINGS = [
  { name: "US-like-voting countries", communities: ['A'] },
  { name: "Russia-like-voting countries", communities: ['G'] },
  { name: "Middle-ground countries", communities: ['B', 'C', 'D', 'E'] },
  { name: "Other countries (edge cases)", communities: ['F'] },
];

// Replicates CPM_COMMUNITY_TO_COLOR_MAP from legacy/app.py
export const COMMUNITY_COLOR_MAP: Record<string, string> = {
  'A': "blue",
  'G': "red",
  'B': "green",
  'C': "green",
  'D': "green",
  'E': "green",
  'F': 'grey',
  'DEFAULT': 'darkgrey',
};

// Replicates various marker style constants from legacy/app.py
export const MARKER_STYLES = {
  groupCentroid: {
    symbol: 'diamond',
    size: 20,
    line: { width: 1, color: 'black' },
  },
  countryCentroid: {
    symbol: 'circle',
    size: 15,
    line: { width: 1, color: 'DarkSlateGrey' },
  },
};

// Replicates text label configuration from legacy/app.py
export const TEXT_LABEL_STYLE = {
  font: { size: 8 },
  position: "middle right",
};

// Defines the order of axes, replicating axis_mapping from legacy/app.py
// a = top, b = right, c = left
export const TERNARY_AXES_CONFIG = {
  a: { prop: 'P_Middle_centroid', title: 'Middle-ground<br>Share' },
  b: { prop: 'P_Russia_centroid', title: 'Russia-like-voting<br>Share' },
  c: { prop: 'P_US_centroid', title: 'US-like-voting<br>Share' },
};