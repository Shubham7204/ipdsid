import React from 'react';
import { DataOverview } from '../components/DataOverview';
import { LearningProgress } from '../components/LearningProgress';

export function DataView() {
  return (
    <div className="min-h-screen bg-blue-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-black text-blue-600 mb-8">Data Overview</h1>
        <div className="space-y-8">
          <LearningProgress />
          <DataOverview />
        </div>
      </div>
    </div>
  );
}