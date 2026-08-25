"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "What is Gimble?",
    answer:
      "Gimble is an AI design tool. Describe the product you have in mind — in plain words — and it generates complete, polished mobile and web app screens in minutes. You can then refine every screen through chat until it's exactly right.",
  },
  {
    question: "Do I need design experience to use it?",
    answer:
      "No. Gimble handles layout, hierarchy, color, and typography for you. If you can describe what you want, you can produce screens that look like they came from a design team.",
  },
  {
    question: "How do credits work?",
    answer:
      "Every generation, regeneration, and AI edit uses credits from the same monthly balance. The Free plan includes 100 credits (about 3 screens); paid plans include 500 to 2,000 credits per month — roughly 50 to 200 screens or edits.",
  },
  {
    question: "Can I edit a design after it's generated?",
    answer:
      "Yes — that's the core workflow. Ask in chat to rewrite a headline, change a layout, update a button, or restyle a whole screen, and Gimble applies the change while keeping the rest of the design consistent.",
  },
  {
    question: "Can I export my designs to Figma or code?",
    answer:
      "On Starter and above, you can export screens to Figma or hand them to AI coding apps to continue building. You can also create click-through prototypes to share with your team.",
  },
  {
    question: "Which AI models power Gimble?",
    answer:
      "Gimble runs on leading models like Claude, Gemini, and Qwen. By default it automatically picks the best model for your prompt, and you can switch models manually anytime.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. The Free plan gives you 100 credits and one project, forever — no credit card required. Upgrade whenever you need more screens, projects, or exports.",
  },
];

const LandingFaq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="w-full py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 lg:grid-cols-[2fr_3fr]">
        {/* Sticky intro column */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="mb-4 inline-flex rounded-full border border-border bg-card px-3.5 py-1 text-xs font-medium text-muted-foreground">
            Common questions
          </p>
          <h2 className="font-display text-4xl leading-[1.1] text-foreground sm:text-5xl">
            Find your answers here.
          </h2>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-muted-foreground">
            Everything about Gimble — generating screens, editing through
            chat, credits, and exports.
          </p>
        </div>

        {/* Accordion */}
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className={cn(
                  "rounded-2xl border bg-card transition-colors",
                  isOpen ? "border-sky-300/60 dark:border-sky-500/30" : "border-border",
                )}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
                >
                  <span className="text-base font-medium text-foreground">
                    {faq.question}
                  </span>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                      isOpen
                        ? "rotate-45 border-sky-500 bg-sky-500 text-white"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    <Plus className="size-4" />
                  </span>
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LandingFaq;
