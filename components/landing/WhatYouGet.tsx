import { ChevronDown } from "lucide-react";
import React, { useState } from "react";

const WhatYouGet = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  const offers = [
    {
      question: "How long does a typical project take?",
      answer:
        "Project timelines vary based on scope and complexity. A typical website project takes 4–8 weeks from initial consultation to launch. This includes discovery, design, development, testing, and deployment phases. We'll provide a detailed timeline during our initial consultation based on your specific requirements.",
    },
    {
      question: "How long does a typical project take?",
      answer:
        "Project timelines vary based on scope and complexity. A typical website project takes 4–8 weeks from initial consultation to launch. This includes discovery, design, development, testing, and deployment phases. We'll provide a detailed timeline during our initial consultation based on your specific requirements.",
    },
  ];
  return (
    <section className="bg-[#f9f9f9] dark:bg-black border border-zinc-200 dark:border-zinc-900 px-6">
      <div className="flex flex-col items-center my-21">
        <span
          className="p-2 px-3
         rounded-full bg-white"
        >
          What you get
        </span>
        <h1 className="text-[40px] my-3 font-semibold text-black tracking-[-0.04em]">
          {" "}
          Five things we are offering
        </h1>
        <p className="text-center">
          See the important capabilities included that simplify <br />
          tasks and improve outcomes significantly
        </p>
      </div>
      <div className="flex justify-center">
        <div className="max-w-1/2">
          {" "}
          <div className="lg:col-span-8 space-y-4 max-w-135 border-x border-gray-200 dark:border-zinc-900 ">
            {offers.map((faq, index) => (
              <div
                key={index}
                className={`border-t border-gray-200 dark:border-zinc-800 px-8 py-2 my-auto ${
                  index === offers.length - 1
                    ? "border-b border-gray-200 dark:border-zinc-800"
                    : ""
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full py-6 flex items-center justify-between text-left transition-colors duration-200 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-expanded={openIndex === index}
                >
                  <span className="text-lg font-normal pr-8 text-black dark:text-white">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`flex shrink-0 transition-transform duration-300 text-black dark:text-white ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openIndex === index
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="pb-6 pr-12 leading-relaxed text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>{" "}
        </div>
        <div className="w-1/2 bg-red-200"></div>
      </div>
    </section>
  );
};

export default WhatYouGet;
