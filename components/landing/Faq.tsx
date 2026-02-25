import React, { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { Inter_Tight } from "next/font/google";
const inter = Inter_Tight({ subsets: ["latin"] });
const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      className={` bg-[#f9f9f9]  dark:bg-black transition-colors duration-300 ${inter.className} px-6`}
    >
      <div className=" flex justify-between items-center  mx-auto  pt-12 border border-b-0 border-gray-200 dark:border-gray-900">
        <div className="flex justify-center ">
          {/* Title Section */}
          <div className="w-1/2 lg:col-span-4 p-6 border-y px-12 dark:border-gray-900 ">
            <p className="bg-white rounded-full px-3.75 py-1 text-sm">
              Common questions
            </p>
            <h1
              className={`text-[40px] py-4 mb-0.5 font-medium leading-tight text-black dark:text-white `}
            >
              Find Your Answers Here
            </h1>
            <p className="text-black/60 text-[18px] leading-[1.55em] font-medium tracking-[-0.03em]">
              Find answers to common questions about Bloopix, <br />
              its features, and how it can help your team.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="lg:col-span-8 space-y-4 w-1/2 border-x border-gray-200 dark:border-gray-900 ">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`border-t border-gray-200 dark:border-gray-800 px-8 py-2 my-auto ${
                  index === faqs.length - 1
                    ? "border-b border-gray-200 dark:border-gray-800"
                    : ""
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full py-6 flex items-center justify-between text-left transition-colors duration-200 hover:text-neutral-600 dark:hover:text-neutral-300"
                  aria-expanded={openIndex === index}
                >
                  <span className="text-lg font-normal pr-8 text-black dark:text-white">
                    {faq.question}
                  </span>
                  <Plus
                    size={16}
                    className={`flex shrink-0 transition-transform duration-300 text-black/65 dark:text-white ${
                      openIndex === index ? "rotate-225 bg-indigo-500 rounded-full text-white p-0.5 h-5 w-5" : ""
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
                  <div className="pb-6 pr-12 leading-relaxed text-neutral-600 dark:text-neutral-400">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Faq;
