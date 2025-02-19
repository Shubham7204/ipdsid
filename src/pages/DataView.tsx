import React from 'react';
import { categories, keywordsByCategory, commonUrls } from '../utils/textProcessing';
import { DataTable } from '../components/DataTable';

export function DataView() {
  // Prepare data for the Keywords table
  const keywordsTableRows = categories.map(category => [
    category,
    keywordsByCategory[category].join(', ')
  ]);

  // Prepare data for the URLs table
  const urlsTableRows = categories.map(category => [
    category,
    commonUrls[category].join(', ')
  ]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-6">Pre-fed Data Overview</h1>
        
        <DataTable
          title="Keywords by Category"
          headers={['Category', 'Keywords']}
          rows={keywordsTableRows}
        />

        <DataTable
          title="Common URLs by Category"
          headers={['Category', 'URLs']}
          rows={urlsTableRows}
        />
      </div>
    </div>
  );
}