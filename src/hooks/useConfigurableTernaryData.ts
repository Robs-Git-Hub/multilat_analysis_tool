
// src/hooks/useConfigurableTernaryData.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateBaseTernaryAttributes, ItemWithTernaryAttributes } from '@/utils/ternaryDataProcessing';
import type { TernaryChartConfig } from '@/config/ternaryChartConfigs';

export type TernaryDataItem = ItemWithTernaryAttributes;

/**
 * A generic, configurable hook for fetching and processing data for ternary charts.
 * It accepts a configuration object that specifies which table and columns to use,
 * and now includes pagination to fetch all rows.
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
      
      const PAGE_SIZE = 1000;
      let allData: any[] = [];
      let page = 0;
      let keepFetching = true;

      while (keepFetching) {
        const { from, to } = { from: page * PAGE_SIZE, to: (page + 1) * PAGE_SIZE - 1 };

        const { data, error } = await supabase
          .from(config.table as any)
          .select(columnsToFetch)
          .range(from, to);

        if (error) {
          console.error(`Error fetching paginated data from ${config.table}:`, error);
          throw new Error(error.message);
        }

        if (data && data.length > 0) {
          allData.push(...data);
          if (data.length < PAGE_SIZE) {
            keepFetching = false;
          } else {
            page++;
          }
        } else {
          keepFetching = false;
        }
      }

      const rawDataWithIds = allData.map((item: any) => ({
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