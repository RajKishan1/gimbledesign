"use client";

import React, { useState } from "react";

export default function BillingToggle() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <label className="inline-flex items-center cursor-pointer">
      <span className="select-none text-sm font-medium text-heading">
        Monthly
      </span>

      <input
        type="checkbox"
        className="sr-only peer"
        checked={isYearly}
        onChange={() => setIsYearly(!isYearly)}
      />

      <div
        className="
          relative mx-3 w-9 h-5
          bg-zinc-200
          rounded-full
             
                    after:content-['']
          after:absolute after:top-0.5 after:left-0.5
          after:h-4 after:w-4
          after:rounded-full
          after:bg-white
          after:transition-all
          peer-checked:after:translate-x-full
        "
      />

      <span className="select-none text-sm font-medium text-heading">
        Anually
      </span>
      <span className="text-xs p-1 px-2 mx-4 text-purple-800 bg-purple-100 rounded-full">
        -20%
      </span>
    </label>
  );
}
