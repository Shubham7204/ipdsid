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
  const learnedHeaders = ['Category', 'Keywords', 'URLs', 'Frequency', 'Confidence'];
  const learnedRows = learningData.map(data => [
    data.category,
    data.keywords.join(', '),
    data.urls.join(', '),
    data.frequency.toString(),
    (data.confidence * 100).toFixed(1) + '%'
  ]);

  // Prepare combined data
  const combinedHeaders = ['Category', 'All Keywords', 'All URLs'];
  const combinedRows = categories.map(category => {
    const learningDataForCategory = learningData.find(data => data.category === category);
    const allKeywords = new Set([
      ...keywordsByCategory[category],
      ...(learningDataForCategory?.keywords || [])
    ]);
    const allUrls = new Set([
      ...commonUrls[category],
      ...(learningDataForCategory?.urls || [])
    ]);

    return [
      category,
      Array.from(allKeywords).join(', '),
      Array.from(allUrls).join(', ')
    ];
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading data...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <DataTable 
        title="Pre-fed Data Overview"
        headers={preFedHeaders}
        rows={preFedRows}
      />

      <DataTable 
        title="Learned Data Overview"
        headers={learnedHeaders}
        rows={learnedRows}
      />

      <DataTable 
        title="Combined Data Overview"
        headers={combinedHeaders}
        rows={combinedRows}
      />
    </div>
  );
} 