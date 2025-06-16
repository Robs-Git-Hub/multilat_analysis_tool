
import { describe, it, expect } from 'vitest';
import {
  calculateAmplifiedCoordinates,
  calculateWeightedGroupCentroids,
  calculateCategoricalCentroids,
  assignColorsToCentroids,
} from './ternaryCalculations';
import type {
  TernaryDataItem,
  AmplifiedTernaryDataItem,
  GroupDefinition,
  Centroid,
  CategoricalWeight,
  CategoryInfo,
} from './ternaryCalculations';

// --- Test Suite for Ternary Calculation Utilities ---

describe('calculateAmplifiedCoordinates', () => {
  it('should correctly calculate amplified coordinates for a valid data item', () => {
    // Arrange
    const data: TernaryDataItem[] = [
      { id: '1', P_US: 0.8, P_Russia: 0.1, P_Middle: 0.1 },
    ];
    const amplificationPower = 2;

    // Act
    const result = calculateAmplifiedCoordinates(data, amplificationPower);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].P_US_amp).toBeCloseTo(0.969696, 5);
    expect(result[0].P_Russia_amp).toBeCloseTo(0.015151, 5);
    expect(result[0].P_Middle_amp).toBeCloseTo(0.015151, 5);
  });

  it('should filter out items with null or undefined coordinate values', () => {
    // Arrange
    const data: TernaryDataItem[] = [
      { id: '1', P_US: 0.8, P_Russia: 0.1, P_Middle: 0.1 },
      { id: '2', P_US: null, P_Russia: 0.5, P_Middle: 0.5 },
      { id: '3', P_US: 0.2, P_Russia: undefined, P_Middle: 0.8 },
    ];
    const amplificationPower = 2;

    // Act
    const result = calculateAmplifiedCoordinates(data, amplificationPower);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should handle zero values without division by zero, falling back to original values', () => {
    // Arrange
    const data: TernaryDataItem[] = [
      { id: '1', P_US: 0, P_Russia: 0, P_Middle: 0 },
    ];
    const amplificationPower = 2;

    // Act
    const result = calculateAmplifiedCoordinates(data, amplificationPower);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].P_US_amp).toBe(0);
    expect(result[0].P_Russia_amp).toBe(0);
    expect(result[0].P_Middle_amp).toBe(0);
  });

  it('should return an empty array if the input is empty', () => {
    // Arrange
    const data: TernaryDataItem[] = [];
    const amplificationPower = 2;

    // Act
    const result = calculateAmplifiedCoordinates(data, amplificationPower);

    // Assert
    expect(result).toEqual([]);
  });
});

describe('calculateWeightedGroupCentroids', () => {
  // CORRECTED: Added P_US, P_Russia, P_Middle to satisfy the AmplifiedTernaryDataItem type
  const items: AmplifiedTernaryDataItem[] = [
    { id: 'a', P_US: 0, P_Russia: 0, P_Middle: 0, P_US_amp: 1.0, P_Russia_amp: 0.0, P_Middle_amp: 0.0, weight_A: 1, weight_B: 0 },
    { id: 'b', P_US: 0, P_Russia: 0, P_Middle: 0, P_US_amp: 0.0, P_Russia_amp: 1.0, P_Middle_amp: 0.0, weight_A: 1, weight_B: 5 },
    { id: 'c', P_US: 0, P_Russia: 0, P_Middle: 0, P_US_amp: 0.5, P_Russia_amp: 0.5, P_Middle_amp: 0.0, weight_A: 0, weight_B: 5 },
  ];

  it('should calculate a centroid correctly based on specified weights', () => {
    // Arrange
    const groupDefs: Record<string, GroupDefinition> = {
      GroupA: { weight_col_name: 'weight_A', label: 'Group A' },
    };

    // Act
    const result = calculateWeightedGroupCentroids(items, groupDefs);

    // Assert
    expect(result).toHaveLength(1);
    const centroidA = result[0];
    expect(centroidA.centroid_group_name).toBe('GroupA');
    // Centroid for GroupA is average of item 'a' and 'b' (equal weight of 1)
    expect(centroidA.P_US_centroid).toBeCloseTo(0.5);
    expect(centroidA.P_Russia_centroid).toBeCloseTo(0.5);
    expect(centroidA.P_Middle_centroid).toBeCloseTo(0.0);
    expect(centroidA.total_weight_for_group).toBe(2);
  });

  it('should return a centroid at the geometric center if no items have weight', () => {
    // Arrange
    const groupDefs: Record<string, GroupDefinition> = {
      GroupC: { weight_col_name: 'weight_C', label: 'Group C' }, // weight_C does not exist
    };

    // Act
    const result = calculateWeightedGroupCentroids(items, groupDefs);

    // Assert
    expect(result).toHaveLength(1);
    const centroidC = result[0];
    expect(centroidC.P_US_centroid).toBeCloseTo(1/3);
    expect(centroidC.P_Russia_centroid).toBeCloseTo(1/3);
    expect(centroidC.P_Middle_centroid).toBeCloseTo(1/3);
    expect(centroidC.total_weight_for_group).toBe(0);
  });
});

describe('calculateCategoricalCentroids', () => {
  // CORRECTED: Added P_US, P_Russia, P_Middle to satisfy the AmplifiedTernaryDataItem type
  const items: AmplifiedTernaryDataItem[] = [
    { id: 1, P_US: 0, P_Russia: 0, P_Middle: 0, P_US_amp: 1.0, P_Russia_amp: 0.0, P_Middle_amp: 0.0 },
    { id: 2, P_US: 0, P_Russia: 0, P_Middle: 0, P_US_amp: 0.0, P_Russia_amp: 1.0, P_Middle_amp: 0.0 },
    { id: 3, P_US: 0, P_Russia: 0, P_Middle: 0, P_US_amp: 0.0, P_Russia_amp: 0.0, P_Middle_amp: 1.0 },
  ];
  const weights: CategoricalWeight[] = [
    { item_id: 1, category_id: 'USA', weight: 1 },
    { item_id: 2, category_id: 'USA', weight: 1 },
    { item_id: 3, category_id: 'RUS', weight: 5 },
    { item_id: 4, category_id: 'CHN', weight: 10 }, // No item with id 4
  ];

  it('should calculate centroids for each category based on weights', () => {
    // Act
    const result = calculateCategoricalCentroids(items, weights, 'id', 'category_id', 'weight');

    // Assert
    expect(result).toHaveLength(2);

    const centroidUSA = result.find(c => c.category_id === 'USA');
    expect(centroidUSA).toBeDefined();
    // Centroid for USA is average of item 1 and 2
    expect(centroidUSA?.P_US_centroid).toBeCloseTo(0.5);
    expect(centroidUSA?.P_Russia_centroid).toBeCloseTo(0.5);
    expect(centroidUSA?.P_Middle_centroid).toBeCloseTo(0.0);
    expect(centroidUSA?.total_weight_for_group).toBe(2);

    const centroidRUS = result.find(c => c.category_id === 'RUS');
    expect(centroidRUS).toBeDefined();
    // Centroid for RUS is just item 3
    expect(centroidRUS?.P_US_centroid).toBeCloseTo(0.0);
    expect(centroidRUS?.P_Russia_centroid).toBeCloseTo(0.0);
    expect(centroidRUS?.P_Middle_centroid).toBeCloseTo(1.0);
    expect(centroidRUS?.total_weight_for_group).toBe(5);
  });
});

describe('assignColorsToCentroids', () => {
  const centroids: Centroid[] = [
    { centroid_group_name: 'USA', category_id: 101, P_US_centroid: 0.5, P_Russia_centroid: 0.5, P_Middle_centroid: 0, total_weight_for_group: 2, label: 'USA' },
    { centroid_group_name: 'RUS', category_id: 102, P_US_centroid: 0, P_Russia_centroid: 0, P_Middle_centroid: 1, total_weight_for_group: 5, label: 'RUS' },
    { centroid_group_name: 'CHN', category_id: 103, P_US_centroid: 0.3, P_Russia_centroid: 0.3, P_Middle_centroid: 0.4, total_weight_for_group: 1, label: 'CHN' },
  ];
  const categoryInfo: CategoryInfo[] = [
    { id: 101, group: 'West' },
    { id: 102, group: 'East' },
    // No info for category 103
  ];
  const colorMap = {
    West: 'blue',
    East: 'red',
    DEFAULT: 'grey',
  };

  it('should assign colors based on category group mapping', () => {
    // Act
    const result = assignColorsToCentroids(centroids, categoryInfo, 'category_id', 'id', 'group', colorMap);

    // Assert
    expect(result).toHaveLength(3);
    expect(result.find(c => c.category_id === 101)?.marker_color_final).toBe('blue');
    expect(result.find(c => c.category_id === 102)?.marker_color_final).toBe('red');
  });

  it('should assign a default color if category info is missing', () => {
    // Act
    const result = assignColorsToCentroids(centroids, categoryInfo, 'category_id', 'id', 'group', colorMap);

    // Assert
    expect(result.find(c => c.category_id === 103)?.marker_color_final).toBe('grey');
  });

  it('should assign the grouping column to the final output', () => {
    // Act
    const result = assignColorsToCentroids(centroids, categoryInfo, 'category_id', 'id', 'group', colorMap);

    // Assert
    expect(result.find(c => c.category_id === 101)?.group).toBe('West');
    expect(result.find(c => c.category_id === 102)?.group).toBe('East');
    expect(result.find(c => c.category_id === 103)?.group).toBeUndefined(); // or null/NA depending on implementation
  });
});