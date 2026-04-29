import React from "react";
import { Inter_Tight } from "next/font/google";
const inter = Inter_Tight({ subsets: ["latin"] });
const HowItWorks = () => {
  const steps = [
    {
      number: "(1)",
      title: "Book a call",
      description:
        "Schedule a quick call to meet us and tell us what you need.",
    },
    {
      number: "(2)",
      title: "Share your vision",
      description: "Walk us through your ideas, goals and imagination.",
    },
    {
      number: "(3)",
      title: "We build your vision",
      description:
        "Our team brings your product to life with care and creativity.",
    },
    {
      number: "(4)",
      title: "You go live",
      description: "Launch your new brand or site and start making an impact.",
    },
  ];

  return (
    <div
      className={`bg-background transition-colors duration-300 pt-10 ${inter.className} border-x border-border`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <h1 className="text-3xl font-medium text-center mb-8 text-foreground">
          How it works?
        </h1>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-0 gap-y-0 mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className={` p-8 ${index < 4 ? "border border-border" : ""}`}
            >
              {/* Step Number */}
              <p className="text-xl font-medium leading-6 mb-5 text-muted-foreground">
                {step.number}
              </p>

              {/* Step Title */}
              <h2 className="text-xl font-medium leading-6 mb-3 text-foreground">
                {step.title}
              </h2>

              {/* Step Description */}
              <p className="max-w-3/5 text-lg font-medium leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowItWorks;
