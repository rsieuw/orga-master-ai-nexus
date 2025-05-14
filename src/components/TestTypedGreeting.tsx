import React from 'react';
import { TypedGreeting } from '@/components/ui/TypedGreeting.tsx';

const TestTypedGreeting: React.FC = () => {
  const priorityColors = {
    high: { start: '#DC2626', end: '#BE185D' },    // Red to Rose
    medium: { start: '#F59E0B', end: '#D97706' },  // Amber to Orange
    low: { start: '#3B82F6', end: '#06B6D4' },     // Blue to Cyan
    none: { start: '#1D4ED8', end: '#6B21A8' }     // Default blue to purple
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Test Typed Greeting Component</h1>
      
      <div className="p-6 rounded-lg shadow-md bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-2">High Priority</h2>
        <div className="text-2xl">
          <TypedGreeting 
            text="Hello! This is a high priority task" 
            speed={50} 
            gradientColors={priorityColors.high}
          />
        </div>
      </div>
      
      <div className="p-6 rounded-lg shadow-md bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-2">Medium Priority</h2>
        <div className="text-2xl">
          <TypedGreeting 
            text="Hello! This is a medium priority task" 
            speed={50} 
            gradientColors={priorityColors.medium}
          />
        </div>
      </div>
      
      <div className="p-6 rounded-lg shadow-md bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-2">Low Priority</h2>
        <div className="text-2xl">
          <TypedGreeting 
            text="Hello! This is a low priority task" 
            speed={50} 
            gradientColors={priorityColors.low}
          />
        </div>
      </div>
      
      <div className="p-6 rounded-lg shadow-md bg-gray-50 dark:bg-gray-800">
        <h2 className="text-xl font-semibold mb-2">No Priority</h2>
        <div className="text-2xl">
          <TypedGreeting 
            text="Hello! This is a task with no priority" 
            speed={50} 
            gradientColors={priorityColors.none}
          />
        </div>
      </div>
    </div>
  );
};

export default TestTypedGreeting; 