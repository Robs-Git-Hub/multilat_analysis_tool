
import { describe, it, expect } from 'vitest';
import {
  calculateBaseTernaryAttributes,
  recalculateBubbleSizes,
} from './ternaryDataProcessing';
import type {
  RawCountItem,
  TernaryAttributesConfig,
  ItemWithTernaryAttributes,
  BubbleSizeConfig,
} from './ternaryDataProcessing';

describe('calculateBaseTernaryAttributes', () => {
  const items: RawCountItem[] = [
    { id: 1, us_mentions: 10, russia_mentions: 40, middle_mentions: 50 },
    { id: 2, us_mentions: 90, russia_mentions: 10, middle_mentions: 0 },
  ];

  const config: TernaryAttributesConfig = {
    us_count_col: 'us_mentions',
    russia_count_col: 'russia_mentions',
    middle_count_col: 'middle_mentions',
  };

  it('should calculate TotalMentions and P-values correctly', () => {
    // Act
    const result = calculateBaseTernaryAttributes(items, config);

    // Assert
    expect(result).toHaveLength(2);

    // --- Verification for Item 1 ---
    const item1 = result.find(item => item.id === 1);
    expect(item1).toBeDefined();
    expect(item1?.TotalMentions).toBe(100);
    expect(item1?.P_US).toBeCloseTo(0.0526, 4);
    expect(item1?.P_Russia).toBeCloseTo(0.4211, 4);
    expect(item1?.P_Middle).toBeCloseTo(0.5263, 4);

    // --- Verification for Item 2 ---
    const item2 = result.find(item => item.id === 2);
    expect(item2).toBeDefined();
    expect(item2?.TotalMentions).toBe(100);
    // Manual calculation verification:
    // r_us=90/100=0.9, r_rus=10/50=0.2, r_mid=0/50=0.0. r_sum=1.1
    // P_US = 0.9/1.1 = 0.818181... which rounds to 0.8182
    // P_Russia = 0.2/1.1 = 0.181818... which rounds to 0.1818
    // P_Middle = 0.0/1.1 = 0.0
    // CORRECTED: Adjusted the expected value to the correctly rounded number.
    expect(item2?.P_US).toBeCloseTo(0.8182, 4);
    expect(item2?.P_Russia).toBeCloseTo(0.1818, 4);
    expect(item2?.P_Middle).toBeCloseTo(0.0, 4);
  });

  it('should handle cases where a count column is missing', () => {
    // Arrange
    const incompleteItems: RawCountItem[] = [
      { id: 1, us_mentions: 10, russia_mentions: 40 }, // missing middle_mentions
    ];

    // Act
    const result = calculateBaseTernaryAttributes(incompleteItems, config);

    // Assert
    expect(result[0].TotalMentions).toBe(50); // 10 + 40 + 0
  });
});

describe('recalculateBubbleSizes', () => {
  // This data matches the 'ItemWithTernaryAttributes' type, which is the expected input
  const items: ItemWithTernaryAttributes[] = [
    { id: 1, us_mentions: 1, russia_mentions: 1, middle_mentions: 1, TotalMentions: 10, P_US: 0.33, P_Russia: 0.33, P_Middle: 0.33 },
    { id: 2, us_mentions: 1, russia_mentions: 1, middle_mentions: 1, TotalMentions: 100, P_US: 0.33, P_Russia: 0.33, P_Middle: 0.33 },
    { id: 3, us_mentions: 1, russia_mentions: 1, middle_mentions: 1, TotalMentions: 1000, P_US: 0.33, P_Russia: 0.33, P_Middle: 0.33 },
    { id: 4, us_mentions: 0, russia_mentions: 0, middle_mentions: 0, TotalMentions: 0, P_US: 0, P_Russia: 0, P_Middle: 0 },
  ];

  const config: BubbleSizeConfig = {
    minSize: 5,
    maxSize: 50,
    scalingPower: 2,
  };

  it('should calculate bubble sizes based on logarithmic scaling', () => {
    // Act
    const result = recalculateBubbleSizes(items, config);

    // Assert
    expect(result.find(i => i.id === 1)?.size_px).toBeCloseTo(5, 1);
    expect(result.find(i => i.id === 2)?.size_px).toBeCloseTo(21.9, 1);
    expect(result.find(i => i.id === 3)?.size_px).toBeCloseTo(50, 1);
  });

  it('should assign minSize to items with zero mentions', () => {
    // Act
    const result = recalculateBubbleSizes(items, config);

    // Assert
    expect(result.find(i => i.id === 4)?.size_px).toBe(config.minSize);
  });
});