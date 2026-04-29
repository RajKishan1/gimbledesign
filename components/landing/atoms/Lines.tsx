import React from "react";

const Lines = () => {
  return (
    <div
      className="min-h-12 w-full flex-1 bg-background"
      style={{
        backgroundImage:
          "repeating-linear-gradient(25deg, var(--border) 0, var(--border) 1px, var(--background) 1px, var(--background) 12px)",
      }}
    />
  );
};

export default Lines;
