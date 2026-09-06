"use client";

import React from "react";
import { Martel } from "next/font/google";
const carattere = Martel({ subsets: ["latin"],weight: "400" });
const TESTIMONIALS = [
  {
    quote:
      "We went from a rough idea to a full product design using just one prompt. Screens, flows, everything — done in minutes.We went from a rough idea to a full product design using just one prompt. ",
    name: "Rahul Mehta",
    role: "Product Manager",
    personImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    companyImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  },
  {
    quote:
      "Gimble generates clean, consistent layouts that actually make sense. Huge time saver for early-stage products.",
    name: "Ananya Verma",
    role: "Startup Founder",
    personImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    companyImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  },
  {
    quote:
      "I just describe what I want, and Gimble gives me complete UI flows ready to build.",
    name: "Arjun Patel",
    role: "Frontend Developer",
    personImage:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    companyImage:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  },
  {
    quote:
      "Gimble helps us visualize the entire product before writing a single line of code.",
    name: "Sneha Kapoor",
    role: "UX Lead",
    personImage:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    companyImage:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  },
  {
    quote:
      "It's fast, intuitive, and surprisingly accurate for end-to-end design generation.",
    name: "Kunal Sharma",
    role: "Indie Hacker",
    personImage:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    companyImage:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
  },
  {
    quote:
      "Instead of designing screen by screen, we now generate complete user journeys instantly.we now generate complete user journeys instantlwe now generate complete user journeys instantl",
    name: "Sneha Joshi",
    role: "Operations & Product",
    personImage:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    companyImage:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
  }, {
    quote:
      "Gimble helps us visualize the entire product before writing a single line of code..Gimble helps us visualize the entire product before writing a single line of code.",
    name: "Sneha Kapoor",
    role: "UX Lead",
    personImage:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    companyImage:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  },{
    quote:
      "We went from a rough idea to a full product design using just one prompt. Screens, flows, everything — done in minutes.",
    name: "Rahul Mehta",
    role: "Product Manager",
    personImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    companyImage:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  },  {
    quote:
      "Gimble generates clean, consistent layouts that actually make sense. Huge time saver for early-stage products.Gimble generates clean, consistent layouts that actually make sense. Huge time saver for early-stage products.",
    name: "Nisha Verma",
    role: "Startup Founder",
    personImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    companyImage:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  },
];

const LandingTestimonials = () => (
  <section className="w-full py-20 sm:py-28">
    <div className="mx-auto max-w-7xl px-6">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="font-display text-4xl text-foreground sm:text-5xl">
          Loved by builders.
        </h2>
        <p className="mt-5 text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
          Founders, PMs, and developers use Gimble to go from idea to shipped
          design — without waiting on anyone.
        </p>
      </div>

      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">
        {TESTIMONIALS.map((testimonial) => (
          <figure
            key={testimonial.name}
            className="mb-5 break-inside-avoid rounded-2xl border border-border bg-card p-6"
          >
            <figcaption className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={testimonial.personImage}
                  alt={`${testimonial.name}'s portrait`}
                  loading="lazy"
                  className="size-10 rounded-full object-cover"
                />
              
              </div>

              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-foreground">
                  {testimonial.name}
                </p>
                <p className="truncate text-[13px] text-muted-foreground">
                  {testimonial.role}
                </p>
              </div>
            </figcaption>

            <blockquote className={`${carattere.className} mt-5 text-[15px] font-light leading-relaxed text-foreground/90`}>
             " {testimonial.quote} "
            </blockquote>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

export default LandingTestimonials;
