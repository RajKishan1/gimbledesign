"use client";

import React from "react";
import { motion } from "framer-motion";

type FeatureCardProps = {
  src: string;
  heading: string;
  text: string;
};

const features = [
  {
    src: "/landing/mobileapp.png",
    heading: "Mobile Apps",
    text: "Complete app screens and flows ",
  },
  {
    src: "/landing/webplatform.png",
    heading: "Web Platforms",
    text: "Landing pages and Dashboards",
  },
  {
    src: "/landing/wire.png",
    heading: "Wireframes",
    text: "Structure before polish",
  },
];

const FeatureSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
      className="my-12 flex gap-4 flex-col md:flex-row"
    >
      {features.map((feature, index) => (
        <FeatureCard
          key={feature.heading}
          src={feature.src}
          heading={feature.heading}
          text={feature.text}
          index={index}
        />
      ))}
    </motion.div>
  );
};

export default FeatureSection;

const FeatureCard = ({
  src,
  heading,
  text,
  index,
}: FeatureCardProps & { index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.45,
        delay: index * 0.08,
        ease: "easeOut",
      }}
     
      whileTap={{
        scale: 0.98,
      }}
      className="group flex flex-1 cursor-pointer flex-col items-center rounded-2xl   p-3  text-center "
    >
      <div className="aspect-[4/3] w-full overflow-hidden rounded-lg ">
        <motion.img
          src={src}
          alt={heading}
          className="h-full w-full rounded-xl object-cover transition-all duration-300 group-hover:scale-105"
         
          transition={{
            duration: 0.35,
            ease: "easeOut",
          }}
        />
      </div>

      <motion.h3
        className="mt-3 text-[16px] font-semibold pl-1"
        transition={{ duration: 0.2 }}
      >
        {heading}
      </motion.h3>

      <p className="text-[14px] text-gray-500 dark:text-gray-400 pl-1">
        {text}
      </p>
    </motion.div>
  );
};