import React from "react";
interface Props {
  imgUrl: string;
  title: string;
  text: string;
}

const TemplateData = [
  {
    imgUrl: "https://picsum.photos/id/1011/400/250",
    title: "Smart Upload",
    text: "Upload your designs instantly with AI-powered suggestions.",
  },
  {
    imgUrl: "https://picsum.photos/id/1025/400/250",
    title: "Modern Landing Pages",
    text: "Choose from sleek landing page templates built for startups.",
  },
  {
    imgUrl: "https://picsum.photos/id/1035/400/250",
    title: "E-Commerce Layouts",
    text: "Pre-made store templates to launch your online shop faster.",
  },
  {
    imgUrl: "https://picsum.photos/id/1043/400/250",
    title: "Creative Portfolios",
    text: "Showcase your work with beautiful portfolio designs.",
  },
  {
    imgUrl: "https://picsum.photos/id/1050/400/250",
    title: "Business Dashboards",
    text: "Professional dashboard UI templates for analytics and reports.",
  },
  {
    imgUrl: "https://picsum.photos/id/1043/400/250",
    title: "Creative Portfolios",
    text: "Showcase your work with beautiful portfolio designs.",
  },
];

export const TemplateCards = ({ imgUrl, title, text }: Props) => {
  return (
    <div className="flex flex-col min-w-96 min-h-129 bg-zinc-50">
      <img src={imgUrl} alt="" className="min-h-96"/>
      <span className=" w-full border p-6">
        {" "}
        <h2 className="font-semibold text-[22px] leading-[1.5em] tracking-[-0.035em] mb-2">{title}</h2>
        <p className="text-black/60 dark:text-zinc-200 text-base leading-[1.6em]">{text}</p>
      </span>
    </div>
  );
};

const ExploreTemplates = () => {
  return (
    <section>
      <div className="flex flex-col mx-auto  items-center mt-18.75">
        <h1 className="text-[40px] font-semibold tracking-[-0.045] text-black dark:text-white mb-3">
          Explore Templates
        </h1>
        <p className="text-center mb-13 text-[17px] leading-[1.55em] tracking-[-0.035em]">
          Customise beautiful pre-built design Templates
        </p>
      </div>
      <div className="grid grid-cols-3 gap-6">
        {TemplateData.map((item, index) => (
          <TemplateCards
            key={index}
            imgUrl={item.imgUrl}
            title={item.title}
            text={item.text}
          />
        ))}
      </div>
    </section>
  );
};

export default ExploreTemplates;
