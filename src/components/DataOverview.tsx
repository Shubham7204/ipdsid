import React from 'react';
import { DataTable } from './DataTable';
import { useLearningData } from '../hooks/useLearningData';
import { categories, commonUrls, keywordsByCategory } from '../utils/textProcessing';

export function DataOverview() {
  const { learningData, isLoading, error } = useLearningData();

  // Prepare pre-fed data
  const preFedHeaders = ['Category', 'Keywords', 'URLs'];
  const preFedRows = categories.map(category => [
    category,
    keywordsByCategory[category].join(', '),
    commonUrls[category].join(', ')
  ]);

  // Prepare learned data
  const learnedHeaders = ['Category', 'Keywords', 'URLs', 'Frequency'];
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

  // Prepare combined data
  const combinedHeaders = ['Category', 'All Keywords', 'All URLs', 'Frequency'];
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-4">Loading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-4 text-red-600">Error loading data</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-4">Pre-fed Knowledge</h3>
        <DataTable headers={preFedHeaders} rows={preFedRows} />
      </div>

      {learningData && (
        <div>
          <h3 className="text-lg font-medium mb-4">Learned Knowledge</h3>
          <DataTable headers={learnedHeaders} rows={learnedRows} />
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium mb-4">Combined Knowledge</h3>
        <DataTable headers={combinedHeaders} rows={combinedRows} />
      </div>
    </div>
  );
} 