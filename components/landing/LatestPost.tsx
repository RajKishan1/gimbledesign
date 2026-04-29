"use client";
import React from "react";

const LatestPost = () => {
  const posts = [
    {
      id: 1,
      title: "How Gimble Turns a Single Prompt into a Full Product Design",
      category: "Productivity",
      date: "Sep 5, 2025",
      gradient:
        "from-gray-200 via-teal-100 to-gray-900 dark:from-gray-800 dark:via-teal-900 dark:to-gray-950",
    },
    {
      id: 2,
      title: "Maximizing productivity while streamlining content workflows",
      category: "Productivity",
      date: "Sep 5, 2025",
      gradient:
        "from-orange-400 via-purple-500 to-cyan-400 dark:from-orange-600 dark:via-purple-700 dark:to-cyan-600",
    },
    {
      id: 3,
      title: "How bloopix makes managing digital content easier and smarter",
      category: "Database",
      date: "Sep 18, 2025",
      gradient:
        "from-yellow-300 via-pink-300 to-cyan-300 dark:from-yellow-600 dark:via-pink-600 dark:to-cyan-600",
    },
  ];

  return (
    <div className="bg-background px-4 md:mt-6 pt-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-12 flex flex-col items-center">
          <h2 className="bg-card text-foreground border border-border p-1.5 px-3 rounded-full mb-2.5 text-sm">
            Latest posts
          </h2>

          {/* Main Heading */}
          <h2 className="mb-4 text-[40px] font-semibold tracking-tight leading-[1.25em] text-foreground">
            Explore recent insights
          </h2>

          {/* Description */}
          <p className="mx-auto max-w-2xl text-muted-foreground text-center text-[17px] leading-[1.55em] tracking-[-0.035em]">
            Discover the latest updates, creative strategies, and
            <br /> design ideas shared through our blog posts
          </p>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid  md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="group cursor-pointer overflow-hidden rounded-none bg-card"
            >
              {/* Image / Gradient Area */}
              <div className="relative h-64 overflow-hidden">
                <div
                  className={`absolute inset-0 bg-linear-to-br ${post.gradient} opacity-90 blur-2xl transition-transform duration-500 group-hover:scale-110`}
                ></div>
                <div
                  className={`absolute inset-0 bg-linear-to-br ${post.gradient} transition-transform duration-500 group-hover:scale-105`}
                ></div>
              </div>

              {/* Content */}
              <div className="p-6 border border-t-0 border-border">
                <h3 className="mb-4 text-xl font-medium leading-[1.5em] tracking-[-0.035em] text-foreground transition-colors group-hover:text-muted-foreground">
                  {post.title}
                </h3>

                {/* Meta Information */}
                <div className="flex items-center gap-3 text-sm leading-[1.55em] tracking-[-0.035] text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {post.category}
                  </span>
                  <span className="h-0.5 w-5 rounded-full bg-muted-foreground"></span>
                  <span className="text-sm">{post.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LatestPost;
