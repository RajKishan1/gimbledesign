import React from 'react';

const PerformanceChart = () => {
  const bars = [
    { month: 'Jan', height: 'h-[70px]' },
    { month: 'Feb', height: 'h-[90px]' },
    { month: 'Mar', height: 'h-[100px]' },
    { month: 'Apr', height: 'h-[80px]' },
    { month: 'May', height: 'h-[95px]' },
    { month: 'Jun', height: 'h-[60px]' },
 
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 py-2 shadow-md w-full mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-white">Performance</h2>
        <div className="bg-cyan-100 rounded-full px-2 py-1 text-sm text-neutral-800 flex items-center">
          <span className="text-green-500 mr-1">↑</span>25%
        </div>
      </div>
      <div className="flex justify-between items-end h-32 ">
        {bars.map((bar, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`w-4 bg-indigo-300 rounded-t-md ${bar.height} md:w-5`}></div>
            <span className="mt-2 text-xs text-neutral-500">{bar.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceChart;