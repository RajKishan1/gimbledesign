import React from "react";

const PerformanceChart = () => {
  const bars = [
    { month: "Jan", height: "h-[70px]" },
    { month: "Feb", height: "h-[90px]" },
    { month: "Mar", height: "h-[100px]" },
    { month: "Apr", height: "h-[80px]" },
    { month: "May", height: "h-[95px]" },
    { month: "Jun", height: "h-[60px]" },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-4 py-2 shadow-md w-full mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-foreground">Performance</h2>
        <div className="bg-primary/10 text-primary border border-primary/25 rounded-full px-2 py-1 text-sm flex items-center">
          <span className="mr-1">↑</span>25%
        </div>
      </div>
      <div className="flex justify-between items-end h-32 ">
        {bars.map((bar, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-4 bg-primary/70 rounded-t-md ${bar.height} md:w-5`}
            ></div>
            <span className="mt-2 text-xs text-muted-foreground">
              {bar.month}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceChart;
