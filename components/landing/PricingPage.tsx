import React from "react";
import { Inter_Tight } from "next/font/google";
const inter = Inter_Tight({ subsets: ["latin"] });
const PricingPage = () => {
  const pricingPlans = [
    {
      title: "Website Design",
      priceLabel: "Starting at",
      price: "$1,999",
      description:
        "Perfect for growing brands that need a strong online presence.",
      buttonText: "Book a call",
      buttonStyle: "dark",
      features: [
        "Free Basic Brand Design",
        "Custom-designed landing page",
        "No-code development ($999+)",
        "Regular Updates",
        "Delivery within 10-15 days",
        "High quality interactions",
        "Communication via Slack/Discord",
      ],
    },
    {
      title: "Unlimited Design",
      priceLabel: "Per month",
      price: "$3,999",
      description:
        "Ideal for startups, SaaS, and apps getting ready to go live.",
      buttonText: "Get Started",
      buttonStyle: "light",
      features: [
        "Product Design",
        "Unlimited Brand Design",
        "No-Code Development",
        "Regular Updates via Slack",
        "No contracts, no meetings",
        "Unlimited requests & revisions",
        "Pause & Cancel anytime",
      ],
    },
    {
      title: "Custom Design",
      priceLabel: "Flexible scope",
      price: "Custom Quote",
      description:
        "Specialized design services built around your unique needs.",
      buttonText: "Book a call",
      buttonStyle: "dark",
      features: [
        "Brand Design",
        "Framer Development",
        "Web/Mobile apps",
        "Social media design",
        "Motion Design",
        "Regular Updates",
        "Unlimited revisions",
      ],
    },
  ];

  return (
    <div className="bg-white dark:bg-black transition-colors duration-300 py-10  border border-zinc-900">
      <div className=" mx-auto">
        {/* Title */}
        <h1
          className={`text-3xl font-medium leading-10 text-center mb-8 text-black dark:text-white ${inter.className}`}
        >
          Pricing
        </h1>

        {/* Pricing Cards Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`mx-auto p-8 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-900 flex flex-col ${
                index === 1 ? "bg-zinc-200 dark:bg-zinc-950" : "bg-black"
              }`}
            >
              {/* Card Header */}
              <div className="mb-8">
                <h2 className="text-lg font-normal mb-6 text-black dark:text-white">
                  {plan.title}
                </h2>

                <div className="mb-4">
                  <p className="text-[15px] leading-4 font-normal  mb-1 text-[#808080]">
                    {plan.priceLabel}
                  </p>
                  <p
                    className={`text-3xl font-medium text-black dark:text-white ${inter.className}`}
                  >
                    {plan.price}
                  </p>
                </div>

                <p className="text-lg font-light leading-5.5 text-[#808080] dark:text-[#808080]">
                  {plan.description}
                </p>
              </div>

              {/* CTA Button */}
              <button
                className={`w-full max-h-11 py-2 px-6 rounded-full text-lg font-medium mb-8 transition-all duration-200
                  ${
                    plan.buttonStyle === "light"
                      ? "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
                      : "bg-white text-black border border-gray-300 hover:bg-gray-50 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:hover:bg-zinc-800"
                  }
                `}
              >
                {plan.buttonText}
              </button>

              {/* Features List */}
              <div>
                <p className="text-base font-medium mb-4 text-gray-500">
                  What's included :
                </p>
                <ul className="space-y-4">
                  {plan.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="text-lg leading-7 font-normal text-black dark:text-white"
                    >
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
