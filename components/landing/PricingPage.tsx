// import React from "react";
// import { Inter_Tight } from "next/font/google";
// const inter = Inter_Tight({ subsets: ["latin"] });
// const PricingPage = () => {
//   const pricingPlans = [
//     {
//       title: "Website Design",
//       priceLabel: "Starting at",
//       price: "$1,999",
//       description:
//         "Perfect for growing brands that need a strong online presence.",
//       buttonText: "Book a call",
//       buttonStyle: "dark",
//       features: [
//         "Free Basic Brand Design",
//         "Custom-designed landing page",
//         "No-code development ($999+)",
//         "Regular Updates",
//         "Delivery within 10-15 days",
//         "High quality interactions",
//         "Communication via Slack/Discord",
//       ],
//     },
//     {
//       title: "Unlimited Design",
//       priceLabel: "Per month",
//       price: "$3,999",
//       description:
//         "Ideal for startups, SaaS, and apps getting ready to go live.",
//       buttonText: "Get Started",
//       buttonStyle: "light",
//       features: [
//         "Product Design",
//         "Unlimited Brand Design",
//         "No-Code Development",
//         "Regular Updates via Slack",
//         "No contracts, no meetings",
//         "Unlimited requests & revisions",
//         "Pause & Cancel anytime",
//       ],
//     },
//     {
//       title: "Custom Design",
//       priceLabel: "Flexible scope",
//       price: "Custom Quote",
//       description:
//         "Specialized design services built around your unique needs.",
//       buttonText: "Book a call",
//       buttonStyle: "dark",
//       features: [
//         "Brand Design",
//         "Framer Development",
//         "Web/Mobile apps",
//         "Social media design",
//         "Motion Design",
//         "Regular Updates",
//         "Unlimited revisions",
//       ],
//     },
//   ];

//   return (
//     <div className="bg-white dark:bg-black transition-colors duration-300 py-10  border border-zinc-900">
//       <div className=" mx-auto">
//         {/* Title */}
//         <h1
//           className={`text-3xl font-medium leading-10 text-center mb-8 text-black dark:text-white ${inter.className}`}
//         >
//           Pricing
//         </h1>

//         {/* Pricing Cards Grid */}
//         <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ">
//           {pricingPlans.map((plan, index) => (
//             <div
//               key={index}
//               className={`mx-auto p-8 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-900 flex flex-col ${
//                 index === 1 ? "bg-zinc-200 dark:bg-zinc-950" : "bg-black"
//               }`}
//             >
//               {/* Card Header */}
//               <div className="mb-8">
//                 <h2 className="text-lg font-normal mb-6 text-black dark:text-white">
//                   {plan.title}
//                 </h2>

//                 <div className="mb-4">
//                   <p className="text-[15px] leading-4 font-normal  mb-1 text-[#808080]">
//                     {plan.priceLabel}
//                   </p>
//                   <p
//                     className={`text-3xl font-medium text-black dark:text-white ${inter.className}`}
//                   >
//                     {plan.price}
//                   </p>
//                 </div>

//                 <p className="text-lg font-light leading-5.5 text-[#808080] dark:text-[#808080]">
//                   {plan.description}
//                 </p>
//               </div>

//               {/* CTA Button */}
//               <button
//                 className={`w-full max-h-11 py-2 px-6 rounded-full text-lg font-medium mb-8 transition-all duration-200
//                   ${
//                     plan.buttonStyle === "light"
//                       ? "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100"
//                       : "bg-white text-black border border-gray-300 hover:bg-gray-50 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:hover:bg-zinc-800"
//                   }
//                 `}
//               >
//                 {plan.buttonText}
//               </button>

//               {/* Features List */}
//               <div>
//                 <p className="text-base font-medium mb-4 text-gray-500">
//                   What's included :
//                 </p>
//                 <ul className="space-y-4">
//                   {plan.features.map((feature, idx) => (
//                     <li
//                       key={idx}
//                       className="text-lg leading-7 font-normal text-black dark:text-white"
//                     >
//                       {feature}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PricingPage;
"use client";
import React from "react";
import BillingToggle from "./atoms/BillingToggle";
import { Check } from "lucide-react";

const PricingPage = () => {
  const [isDark, setIsDark] = React.useState(false);

  const plans = [
    {
      name: "Starter plan",
      description: "A simple way to try Gimble",
      price: "$0",
      period: "/month",
      features: [
        { text: "Scrape 500 pages", highlighted: false },
        { text: "Single-screen designs", highlighted: false },
        { text: "Basic layout & spacing", highlighted: false },
        { text: "Prompt-based UI generation", highlighted: false },
      ],
      buttonText: "Get started now",
      buttonVariant: "outline" as const,
      popular: false,
    },
    {
      name: "Pro plan",
      description: "For builders shipping real products",
      price: "$49",
      period: "/month",
      features: [
        { text: "Unlimited design generations", highlighted: true },
        {
          text: "full product flows & multi-screen designs",
          highlighted: true,
        },
        { text: "One-prompt end-to-end UI generation", highlighted: true },
        { text: "Editable layers & components", highlighted: true },
      ],
      buttonText: "Upgrade to Pro",
      buttonVariant: "primary" as const,
      popular: true,
    },
    {
      name: "Scale plan",
      description: "For teams building at scale",
      price: "$99",
      period: "/month",
      features: [
        { text: "Everything in Pro", highlighted: false },
        { text: "Team collaboration & shared projects", highlighted: false },
        { text: "Custom design systems & brand presets", highlighted: false },
        { text: "Advanced layout control & constraints", highlighted: false },
      ],
      buttonText: "Upgrade to Pro",
      buttonVariant: "outline" as const,
      popular: false,
    },
  ];

  return (
    <div className={isDark ? "dark" : ""}>
      <div className=" bg-[#f9f9f9] px-4 pt-12 dark:bg-black sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center">
            <h2 className="bg-white p-1.5 px-3 rounded-full mb-2.5 text-black text-[13px] font-medium">
              Choose a plan
            </h2>
            <h1 className="text-[40px] font-semibold tracking-[-0.045] text-black dark:text-white my-3">
              Choose the best plan
            </h1>
            <p className="text-center mb-13 text-[17px] leading-[1.55em] tracking-[-0.035em]">
              See all the pricing options available, compare
              <br /> features across plans and find the one that perfectly.
            </p>
            <BillingToggle />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 mt-10">
            {plans.map((plan, index) => (
              <div
                key={index}
                className="relative flex flex-col  border border-gray-200 bg-[#f9f9f9]  dark:border-zinc-900 dark:bg-zinc-950 "
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute right-6 top-6">
                    <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                      Popular
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-6 px-6 pt-6">
                  <h3 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-base text-gray-600 dark:text-gray-400">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-2 px-6">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-medium text-gray-900 dark:text-white">
                      {plan.price}
                    </span>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <hr className=" my-8" />
                <div className="mb-8 flex-1 space-y-5 px-6">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      {feature.highlighted ? (
                        <span className="bg-indigo-600 flex items-center justify-center rounded-full h-5 w-5">
                          <Check stroke="white" size={12} />
                        </span>
                      ) : (
                        <svg
                          className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      <span className="text-base text-gray-700 dark:text-gray-300">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <div className="p-6 border-t border-zinc-200">
                  {" "}
                  <button
                    className={`w-full rounded-lg px-6 py-3 font-semibold transition-all ${
                      plan.buttonVariant === "primary"
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800"
                        : "border border-gray-100 bg-white text-gray-900 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
