import React from 'react';
import { DataOverview } from '../components/DataOverview';

export function DataView() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Data Overview</h1>
      <DataOverview />
    </div>
  );
}