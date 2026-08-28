import React from "react";
type Card = {
  text: string;
  src: string;
};
const ImageData: Card[] = [
  {
    src: "/landing/mobiledesigns/1.jpeg",
    text: "LogIn Page",
  },

  {
    src: "/landing/mobiledesigns/6.jpeg",
    text: "Pricing",
  },
  {
    src: "/landing/mobiledesigns/7.jpeg",
    text: "Home",
  },
  {
    src: "/landing/mobiledesigns/8.jpeg",
    text: "Search",
  },
  {
    src: "/landing/mobiledesigns/9.jpeg",
    text: "Loading",
  },

  {
    src: "/landing/mobiledesigns/11.jpeg",
    text: "Favourites",
  },
  {
    src: "/landing/mobiledesigns/12.jpeg",
    text: "Get Started",
  },
  {
    src: "/landing/mobiledesigns/13.jpeg",
    text: "Home Page",
  },
  {
    src: "/landing/mobiledesigns/14.jpeg",
    text: "Sidebar",
  },
  {
    src: "/landing/mobiledesigns/15.jpeg",
    text: "Let's Start",
  },
  {
    src: "/landing/mobiledesigns/2.jpeg",
    text: "Product Showcase",
  },
  {
    src: "/landing/mobiledesigns/3.jpeg",
    text: "Checkout",
  },
  {
    src: "/landing/mobiledesigns/4.jpeg",
    text: "Dashboard",
  },
  {
    src: "/landing/mobiledesigns/5.jpeg",
    text: "Settings",
  },
  {
    src: "/landing/mobiledesigns/10.jpeg",
    text: "Joining",
  },
  {
    src: "/landing/mobiledesigns/16.jpeg",
    text: "Copilot",
  },
  {
    src: "/landing/mobiledesigns/17.jpeg",
    text: "Customise",
  },
];
const DesignShowcase = () => {
  return (
    <div className="flex flex-col mt-20 ">
      <h1 className="font-display max-w-2xl text text-center text-4xl leading-[1.15] text-foreground sm:text-5xl mx-auto mb-10">
        Find design patterns in seconds.
      </h1>
      <div className="overflow-x-hidden">
        <div className="carousel-track flex   gap-5  shrink-0 mx-auto">
          {ImageData.map((item, index) => (
            <DesignCard key={index} src={item.src} text={item.text} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesignShowcase;

export const DesignCard = ({ src, text }: Card) => {
  return (
    <div>
      <h1 className="text-center py-6 text-[16px] text-[#202020] dark:text-gray-300 font-semibold">
        {text}
      </h1>
      <div className=" h-145 w-67  rounded-3xl border-gray-400">
        <img
          src={src}
          alt="#"
          className="w-full h-full object-contain rounded-3xl"
        />
      </div>
    </div>
  );
};
