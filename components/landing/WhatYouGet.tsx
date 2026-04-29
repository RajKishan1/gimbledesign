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
    {
      question: "How long does a typical project take?",
      answer:
        "Project timelines vary based on scope and complexity. A typical website project takes 4–8 weeks from initial consultation to launch. This includes discovery, design, development, testing, and deployment phases. We'll provide a detailed timeline during our initial consultation based on your specific requirements.",
    },
  ];
  return (
    <section className="bg-background border border-border px-6">
      <div className="flex flex-col items-center my-21">
        <span className="p-1 px-3.75 text-[13px] rounded-full bg-card text-foreground border border-border font-medium">
          What you get
        </span>
        <h1 className="text-[40px] my-3 font-semibold text-foreground tracking-[-0.04em]">
          {" "}
          Five things we are offering
        </h1>
        <p className="text-center text-[17px] leading-[1.55em] tracking-[-0.035em] text-muted-foreground">
          See the important capabilities included that simplify <br />
          tasks and improve outcomes significantly
        </p>
      </div>
      <div className="flex justify-center">
        <div className="max-w-1/2">
          {" "}
          <div className="lg:col-span-8 space-y-4 max-w-135 border-x border-border">
            {offers.map((faq, index) => (
              <div
                key={index}
                className={`border-t border-border px-8 py-2 my-auto ${
                  index === offers.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full py-6 flex items-center justify-between text-left transition-colors duration-200 hover:text-muted-foreground"
                  aria-expanded={openIndex === index}
                >
                  <span className="text-lg font-normal pr-8 text-foreground">
                    {faq.question}
                  </span>
                  <ChevronDown
                    size={20}
                    className={`flex shrink-0 transition-transform duration-300 text-foreground ${
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
                  <div className="pb-6 pr-12 leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>{" "}
        </div>
        <div className="w-1/2 bg-card border-t border-r border-border"></div>
      </div>
    </section>
  );
};

export default WhatYouGet;
