import React from 'react';
import { DataTable } from './DataTable';
import { useLearningData } from '../hooks/useLearningData';
import { categories, commonUrls, keywordsByCategory } from '../utils/textProcessing';

export function DataOverview() {
  const { learningData, isLoading, error } = useLearningData();

  const headers = ['Category', 'Keywords', 'URLs', 'Frequency'];

  // Pre-fed knowledge rows
  const preFedRows = categories.map(category => [
    category,
    keywordsByCategory[category].join(', '),
    commonUrls[category].join(', '),
    '0'
  ]);

  // Learned knowledge rows with proper data mapping
  const learnedRows = learningData ? 
    learningData.categories.map(cat => {
      const categoryKeywords = learningData.keywords
        .filter(k => k.category === cat.name)
        .map(k => k.keyword)
        .join(', ');
      
      const categoryUrls = learningData.urls
        .filter(u => u.category === cat.name)
        .map(u => u.url)
        .join(', ');
      
      return [
        cat.name,
        categoryKeywords,
        categoryUrls,
        cat.count.toString()
      ];
    }) : [];

  // Combined knowledge rows
  const combinedRows = categories.map(category => {
    const categoryData = learningData?.categories.find(c => c.name === category);
    const frequency = categoryData?.count || 0;
    
    const learnedKeywords = learningData?.keywords
      .filter(k => k.category === category)
      .map(k => k.keyword) || [];
    
    const allKeywords = new Set([
      ...keywordsByCategory[category],
      ...learnedKeywords
    ]);

    const learnedUrls = learningData?.urls
      .filter(u => u.category === category)
      .map(u => u.url) || [];

    const allUrls = new Set([
      ...commonUrls[category],
      ...learnedUrls
    ]);

    return [
      category,
      Array.from(allKeywords).join(', '),
      Array.from(allUrls).join(', '),
      frequency.toString()
    ];
  });

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
        <div className="text-center py-4">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
        <div className="text-center py-4 text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
        <h3 className="text-2xl font-black text-blue-600 mb-6">Pre-fed Knowledge</h3>
        <DataTable headers={headers} rows={preFedRows} />
      </div>

      {learningData && (
        <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
          <h3 className="text-2xl font-black text-blue-600 mb-6">Learned Knowledge</h3>
          <DataTable headers={headers} rows={learnedRows} />
        </div>
      )}

      <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
        <h3 className="text-2xl font-black text-blue-600 mb-6">Combined Knowledge</h3>
        <DataTable headers={headers} rows={combinedRows} />
      </div>
    </div>
  );
} 