import React from 'react';
import { useLearningData } from '../hooks/useLearningData';
import { Book, Link, Tag, RefreshCw } from 'lucide-react';

export function CombinedKnowledge() {
  const { learningData, isLoading, refetch } = useLearningData();

  if (isLoading) {
    return <div className="text-center py-4">Loading knowledge base...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Book className="text-indigo-500" />
          Combined Knowledge
        </h2>
        <button
          onClick={() => refetch()}
          className="text-gray-500 hover:text-gray-700"
          title="Refresh data"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keywords Section */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Tag className="text-blue-500" />
            Learned Keywords
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {learningData?.keywords.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.keyword}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.count}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* URLs Section */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Link className="text-green-500" />
            Visited Resources
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visits</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Safety</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {learningData?.urls.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-blue-600">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {item.url}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.visits}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {item.safetyRating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 