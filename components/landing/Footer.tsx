import React from "react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const Footer: React.FC = () => {
  const footerSections: FooterSection[] = [
    {
      title: "The Good",
      links: [
        { label: "Home", href: "#" },
        { label: "Manifesto", href: "#" },
        { label: "Research", href: "#" },
        { label: "Careers", href: "#" },
      ],
    },
    {
      title: "The Boring",
      links: [
        { label: "Terms of Use", href: "#" },
        { label: "Play by the Rules", href: "#" },
      ],
    },
    {
      title: "The Cool",
      links: [
        { label: "X", href: "#" },
        { label: "Instagram", href: "#" },
      ],
    },
  ];

  return (
    <footer className="relative bg-linear-to-b from-black to-zinc-950 overflow-hidden border border-zinc-900">


      <div className="container mx-auto px-6 md:px-12 lg:px-20 pt-16 pb-8">
        {/* Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-16">
          {/* Logo Section */}
          <div className="sm:col-span-2 lg:col-span-1 flex items-start">
            <div className="bg-zinc-900 p-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
              <svg
                className="w-8 h-8 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
                <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
                <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* Footer Links Sections */}
          {footerSections.map((section, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-zinc-50 font-semibold text-base md:text-lg">
                {section.title}
              </h3>
              <ul className="space-y-1.5">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-zinc-300 hover:text-zinc-100 text-sm md:text-base transition-colors duration-200 inline-block hover:translate-x-1 transform"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Large Brand Text */}
        <div className="relative overflow-hidden py-8 ">
          <h2 className="text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] xl:text-[14rem] font-black text-white leading-none tracking-tight text-center">
            Gimble
          </h2>

          <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Bottom Copyright Section */}
        <div className="border-t border-gray-300 pt-8 mt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Gimble. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      {/* <div className="absolute bottom-20 right-10 w-32 h-32 bg-cyan-200 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute top-40 left-10 w-40 h-40 bg-red-200 rounded-full blur-3xl opacity-20 pointer-events-none" /> */}
    </footer>
  );
};

const FooterDemo: React.FC = () => {
  return (
    <div className="min-h-36 bg-black">
      <div className="h-auto"></div>

      <Footer />
    </div>
  );
};

export default FooterDemo;
