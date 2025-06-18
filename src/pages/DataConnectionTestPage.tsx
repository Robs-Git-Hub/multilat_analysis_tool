
// File: src/pages/DataConnectionTestPage.tsx

import { useDataConnectionTest } from '../hooks/useDataConnectionTest';

export function DataConnectionTestPage() {
  const { data, error, isLoading } = useDataConnectionTest();

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem' }}>
      <h1>Data Connection Test</h1>
      <p>This page tests the connection to key Supabase tables and views.</p>
      
      {isLoading && <p>Loading data...</p>}
      
      {error && (
        <div style={{ color: 'red' }}>
          <h2>An Error Occurred:</h2>
          <pre>{error}</pre>
        </div>
      )}
      
      {data && (
        <div>
          <h2>Connection Successful! ✅</h2>
          <p>Received data from all sources:</p>
          
          <h3>First row from `oewg_ngram_statistics`:</h3>
          <pre style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '4px' }}>
            {JSON.stringify(data.ngramStats, null, 2)}
          </pre>
          
          <h3>First row from `vw_country_ngram_sentence_counts`:</h3>
          <pre style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '4px' }}>
            {JSON.stringify(data.countryCounts, null, 2)}
          </pre>

          <h3>First row from `country`:</h3>
          <pre style={{ background: '#f0f0f0', padding: '1rem', borderRadius: '4px' }}>
            {JSON.stringify(data.countryData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}