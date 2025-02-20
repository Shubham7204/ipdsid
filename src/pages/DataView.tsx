import React from 'react';
import { DataOverview } from '../components/DataOverview';
import { LearningProgress } from '../components/LearningProgress';

export function DataView() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Data Overview</h1>
      <div className="space-y-8">
        <LearningProgress />
        <DataOverview />
      </div>
    </div>
  );
}