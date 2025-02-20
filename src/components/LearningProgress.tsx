import React from 'react';
import { useLearningData } from '../hooks/useLearningData';
import { BarChart, Brain, Target, Tag } from 'lucide-react';

export function LearningProgress() {
  const { learningData } = useLearningData();

  const calculateProgress = () => {
    if (!learningData) return 0;
    const totalCategories = Object.keys(learningData.categories || {}).length;
    const totalKeywords = Object.keys(learningData.keywords || {}).length;
    return Math.min(100, ((totalCategories + totalKeywords) / 100) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Brain className="text-purple-500" />
        Learning Progress
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Categories Learned</h3>
            <Target className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {Object.keys(learningData?.categories || {}).length}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Keywords Identified</h3>
            <Tag className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {Object.keys(learningData?.keywords || {}).length}
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Overall Progress</h3>
            <BarChart className="text-green-500" />
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                  {calculateProgress().toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
              <div
                style={{ width: `${calculateProgress()}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 