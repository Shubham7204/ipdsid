import { useLearningData } from '../hooks/useLearningData';
import { Book, Link, Tag, RefreshCw } from 'lucide-react';

export function CombinedKnowledge() {
  const { learningData, isLoading, refetch } = useLearningData();

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
        <div className="text-center py-4">Loading knowledge base...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-blue-600 flex items-center gap-2">
          <Book size={24} />
          Combined Knowledge
        </h2>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] transition-all"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keywords Section */}
        <div className="bg-white p-6 rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
            <Tag size={20} />
            Learned Keywords
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Keyword</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Count</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {learningData?.keywords.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.keyword}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.count}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* URLs Section */}
        <div className="bg-white p-6 rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-600">
            <Link size={20} />
            Visited Resources
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">URL</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Visits</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
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
                    <td className="px-4 py-3 text-sm text-gray-500">{item.category}</td>
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