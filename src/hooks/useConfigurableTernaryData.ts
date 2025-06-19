
// src/hooks/useConfigurableTernaryData.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateBaseTernaryAttributes, ItemWithTernaryAttributes } from '@/utils/ternaryDataProcessing';
import type { TernaryChartConfig } from '@/config/ternaryChartConfigs';

export type TernaryDataItem = ItemWithTernaryAttributes;

/**
 * A generic, configurable hook for fetching and processing data for ternary charts.
 * It accepts a configuration object that specifies which table and columns to use.
 *
 * @param {TernaryChartConfig} config - The configuration object for the data source.
 */
export const useConfigurableTernaryData = (config: TernaryChartConfig) => {
  return useQuery<TernaryDataItem[], Error>({
    queryKey: ['ternaryData', config.table],
    queryFn: async () => {
      const columnsToFetch = [
        config.labelCol,
        config.usCountCol,
        config.russiaCountCol,
        config.middleCountCol,
      ].join(',');

      // THE FIX: Use a type assertion `as any` to assure TypeScript that
      // the `config.table` string is a valid table name. This resolves the
      // strict type-checking error from the Supabase client.
      const { data, error } = await supabase
        .from(config.table as any) 
        .select(columnsToFetch);

      if (error) {
        console.error(`Error fetching data from ${config.table}:`, error);
        throw new Error(error.message);
      }

      if (!data) {
        return [];
      }

      const rawDataWithIds = data.map((item: any) => ({ // Add :any here to resolve follow-on errors
        ...item,
        id: item[config.idCol],
      }));

      const processedData = calculateBaseTernaryAttributes(rawDataWithIds, {
        us_count_col: config.usCountCol,
        russia_count_col: config.russiaCountCol,
        middle_count_col: config.middleCountCol,
      });

      return processedData;
    },
    enabled: !!config,
  });
};