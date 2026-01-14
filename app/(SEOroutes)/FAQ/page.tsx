import React from "react";
import { ChevronDown } from "lucide-react";
import { Inter_Tight } from "next/font/google";
import Header from "@/app/(routes)/_common/header";

const inter = Inter_Tight({ subsets: ["latin"] });

const Faq = () => {
  const faqs = [
    {
      question: "How long does a typical project take?",
      answer:
        "Project timelines vary based on scope and complexity. A typical website project takes 4–8 weeks from initial consultation to launch. This includes discovery, design, development, testing, and deployment phases. We'll provide a detailed timeline during our initial consultation based on your specific requirements.",
    },
    {
      question: "What is your design process like?",
      answer:
        "Our design process follows a structured approach: We start with discovery to understand your goals and audience, then move to wireframing and prototyping. After your approval, we create high-fidelity designs, followed by development and testing. Throughout the process, we maintain open communication and incorporate your feedback at each milestone.",
    },
    {
      question: "Do you offer revisions?",
      answer:
        "Yes, we include a set number of revision rounds in our project packages. Typically, you'll have 2–3 rounds of revisions at key stages. Additional revisions beyond the agreed scope can be accommodated and will be quoted separately.",
    },
    {
      question: "What if I need support after the project is complete?",
      answer:
        "We offer post-launch support options including maintenance packages, technical support retainers, and on-demand assistance. All projects include a warranty period for bug fixes and technical issues.",
    },
  ];

  return (
    <section>
      <Header />
      <div className={`bg-white dark:bg-black ${inter.className}`}>
        <div className="max-w-6xl mx-auto py-16 border border-zinc-900">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Title */}
            <div className="lg:col-span-4 p-6 border border-zinc-900">
              <h1 className="text-3xl font-medium text-black dark:text-white">
                Frequently Asked
                <br />
                Questions
              </h1>
            </div>

            {/* FAQ List */}
            <div className="lg:col-span-8 border-l border-r border-gray-200 dark:border-zinc-900">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className={`px-8 py-6 border-t border-gray-200 dark:border-zinc-800 ${
                    index === faqs.length - 1
                      ? "border-b border-gray-200 dark:border-zinc-800"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-normal text-black dark:text-white">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      size={20}
                      className="text-black dark:text-white opacity-50"
                    />
                  </div>

                  <p className="pr-12 leading-relaxed text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Faq;
