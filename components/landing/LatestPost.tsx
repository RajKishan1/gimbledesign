"use client";
import React from "react";

const LatestPost = () => {
  const [isDark, setIsDark] = React.useState(false);

  const posts = [
    {
      id: 1,
      title: "How Gimble Turns a Single Prompt into a Full Product Design",
      category: "Productivity",
      date: "Sep 5, 2025",
      linear: "from-gray-200 via-teal-100 to-gray-900",
      darklinear: "from-gray-800 via-teal-900 to-gray-950",
    },
    {
      id: 2,
      title: "Maximizing productivity while streamlining content workflows",
      category: "Productivity",
      date: "Sep 5, 2025",
      linear: "from-orange-400 via-purple-500 to-cyan-400",
      darklinear: "from-orange-600 via-purple-700 to-cyan-600",
    },
    {
      id: 3,
      title: "How bloopix makes managing digital content easier and smarter",
      category: "Database",
      date: "Sep 18, 2025",
      linear: "from-yellow-300 via-pink-300 to-cyan-300",
      darklinear: "from-yellow-600 via-pink-600 to-cyan-600",
    },
  ];

  return (
    <div className={isDark ? "dark" : ""}>
      <div className=" bg-gray-50 px-4 md:mt-6 pt-16 dark:bg-gray-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header Section */}
          <div className="mb-12 flex flex-col items-center">
            <h2 className="bg-white p-1.5 px-3 rounded-full mb-2.5 text-black text-sm">
              Latest posts
            </h2>

            {/* Main Heading */}
            <h2 className="mb-4 text-[40px] font-semibold tracking-tight leading-[1.25em] text-black dark:text-white ">
              Explore recent insights
            </h2>

            {/* Description */}
            <p className="mx-auto max-w-2xl text-neutral-600 text-center dark:text-neutral-400  text-[17px] leading-[1.55em] tracking-[-0.035em]">
              Discover the latest updates, creative strategies, and
              <br /> design ideas shared through our blog posts
            </p>
          </div>

          {/* Blog Cards Grid */}
          <div className="grid  md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group cursor-pointer overflow-hidden rounded-none  bg-white   dark:bg-gray-900"
              >
                {/* Image/linear Area */}
                <div className="relative h-64 overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${
                      isDark ? post.darklinear : post.linear
                    } opacity-90 blur-2xl transition-transform duration-500 group-hover:scale-110`}
                  ></div>
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${
                      isDark ? post.darklinear : post.linear
                    } transition-transform duration-500 group-hover:scale-105`}
                  ></div>
                </div>

                {/* Content */}
                <div className="p-6 border border-t-0 border-gray-200">
                  <h3 className="mb-4 text-xl font-medium leading-[1.5em] tracking-[-0.035em] text-neutral-900 transition-colors group-hover:text-neutral-700 dark:text-white dark:group-hover:text-neutral-300">
                    {post.title}
                  </h3>

                  {/* Meta Information */}
                  <div className="flex items-center gap-3 text-sm  leading-[1.55em] tracking-[-0.035] text-black/80 dark:text-neutral-400">
                    <span className="font-medium ">{post.category}</span>
                    <span className="h-0.5 w-5 rounded-full bg-gray-400 "></span>
                    <span className="text-sm text-black/60">{post.date}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatestPost;
