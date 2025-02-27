import React from "react";
import { useLearningData } from "../hooks/useLearningData";
import { BarChart, Brain, Target, Tag } from "lucide-react";

export function LearningProgress() {
  const { learningData } = useLearningData();

  const calculateProgress = () => {
    if (!learningData) return 0;
    const totalCategories = Object.keys(learningData.categories || {}).length;
    const totalKeywords = Object.keys(learningData.keywords || {}).length;
    return Math.min(100, ((totalCategories + totalKeywords) / 100) * 100);
  };

  return (
    <div className="bg-white p-8 rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.8)]">
      <h2 className="text-3xl font-black text-blue-600 mb-8 flex items-center gap-3">
        <Brain size={32} className="text-blue-600" />
        Learning Progress
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-blue-600">Categories</h3>
            <Target size={24} className="text-blue-600" />
          </div>
          <p className="text-3xl font-black text-blue-600">
            {Object.keys(learningData?.categories || {}).length}
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-blue-600">Keywords</h3>
            <Tag size={24} className="text-blue-600" />
          </div>
          <p className="text-3xl font-black text-blue-600">
            {Object.keys(learningData?.keywords || {}).length}
          </p>
        </div>
      </div>
    </div>
  );
}
