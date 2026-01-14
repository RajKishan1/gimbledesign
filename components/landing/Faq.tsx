import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Inter_Tight } from 'next/font/google';
const inter = Inter_Tight({ subsets: ["latin"] })
const Faq = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const faqs = [
        {
            question: "How long does a typical project take?",
            answer:
                "Project timelines vary based on scope and complexity. A typical website project takes 4–8 weeks from initial consultation to launch. This includes discovery, design, development, testing, and deployment phases. We'll provide a detailed timeline during our initial consultation based on your specific requirements."
        },
        {
            question: "What is your design process like?",
            answer:
                "Our design process follows a structured approach: We start with discovery to understand your goals and audience, then move to wireframing and prototyping. After your approval, we create high-fidelity designs, followed by development and testing. Throughout the process, we maintain open communication and incorporate your feedback at each milestone."
        },
        {
            question: "Do you offer revisions?",
            answer:
                "Yes, we include a set number of revision rounds in our project packages. Typically, you'll have 2–3 rounds of revisions at key stages. Additional revisions beyond the agreed scope can be accommodated and will be quoted separately."
        },
        {
            question: "What if I need support after the project is complete?",
            answer:
                "We offer post-launch support options including maintenance packages, technical support retainers, and on-demand assistance. All projects include a warranty period for bug fixes and technical issues."
        }
    ];

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className={` bg-white dark:bg-black transition-colors duration-300 ${inter.className} `}>
            <div className="max-w-6xl mx-auto  py-16 border border-zinc-900">

                <div className="grid grid-cols-1 lg:grid-cols-12 ">

                    {/* Title Section */}
                    <div className="lg:col-span-4 p-6 border border-zinc-900 w-full">
                        <h1 className={`text-3xl font-medium leading-tight text-black dark:text-white `}>
                            Frequently Asked<br />Questions
                        </h1>
                    </div>

                    {/* FAQ Items */}
                    <div className="lg:col-span-8 space-y-4 max-w-175 border-l border-r border-gray-200 dark:border-zinc-900 ">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`border-t border-gray-200 dark:border-zinc-800 px-8 py-2 my-auto ${
                                    index === faqs.length - 1
                                        ? 'border-b border-gray-200 dark:border-zinc-800'
                                        : ''
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
                                            openIndex === index ? 'rotate-180' : ''
                                        }`}
                                    />
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                        openIndex === index
                                            ? 'max-h-96 opacity-100'
                                            : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="pb-6 pr-12 leading-relaxed text-gray-600 dark:text-gray-400">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Faq;



