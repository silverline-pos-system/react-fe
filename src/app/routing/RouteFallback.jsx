import React from 'react';

export default function RouteFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-sm font-medium text-slate-500">Loading module...</div>
    </div>
  );
}
