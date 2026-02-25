import { ReactElement } from "react";
import PerformanceChart from "./atoms/PerformanceChart";

export default function FeaturesBento() {
  function FeatureCard({
    children,
    className = "",
  }: {
    children: any;
    className?: any;
  }) {
    return (
      <div
        className={`
        rounded-2xl border border-neutral-200 dark:border-gray-900
        bg-neutral-50 dark:bg-neutral-950
        p-6 shadow-sm hover:shadow-md transition
        ${className}
      `}
      >
        {children}
      </div>
    );
  }

  function ChartMock() {
    return (
      <div className="h-40 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 flex items-end gap-2">
        {[40, 70, 55, 80, 60].map((h, i) => (
          <div
            key={i}
            className="w-6 rounded-md bg-indigo-500/80"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    );
  }
  function IntegrationMock() {
    return (
      <div className="h-40 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
        <div className="relative w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-indigo-500" />
        </div>
      </div>
    );
  }
  // function ResponsiveMock() {
  //   return (
  //     <div className="h-40 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-gray-900 flex items-center justify-center gap-3">
  //       <div className="w-10 h-20 bg-neutral-200 dark:bg-neutral-700 rounded-md" />
  //       <div className="w-20 h-28 bg-neutral-200 dark:bg-neutral-700 rounded-md" />
  //     </div>
  //   );
  // }

  const ResponsiveMock: React.FC = () => {
    return (
      <div className="relative w-full h-64 bg-white dark:bg-gray-900 flex items-center justify-center rounded-xl">
        {/* Desktop Mockup */}
        <div className="relative z-0 w-72 h-48 md:w-96 md:h-64 bg-white dark:bg-gray-900 rounded-t-xl shadow-lg p-4 flex flex-col gap-2">
          {/* Blue Dot */}
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          {/* Search Bar */}
          <div className="w-full h-4 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
          {/* Text Line */}
          <div className="w-3/4 h-3 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
          {/* Blue Button */}
          <div className="w-20 h-6 bg-blue-500 rounded-full "></div>
          {/* Content Area */}
          <div className="w-full flex-1 bg-gray-100 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Mobile Mockup */}
        <div className="absolute z-10 bottom-15 right-10 w-32 h-48 md:w-32 md:h-56 bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-3 flex flex-col gap-1.5 translate-x-1/4 translate-y-1/4 md:translate-x-1/3 md:translate-y-1/3">
          {/* Blue Dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          {/* Search Bar */}
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
          {/* Text Line */}
          <div className="w-3/4 h-2 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
          {/* Blue Button */}
          <div className="w-16 h-4 bg-blue-500 rounded-full self-center"></div>
          {/* Content Area */}
          <div className="w-full flex-1 bg-gray-100 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  };

  function MockUI() {
    return (
      <div className="h-40 rounded-xl bg-white dark:bg-gray-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center">
        <div className="w-3/4 h-4 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    );
  }

  return (
    <section className="relative py-20 bg-white dark:bg-black border border-gray-900 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-sm font-medium tracking-wide text-indigo-500 dark:text-indigo-400">
            FEATURES
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-neutral-900 dark:text-neutral-100">
            Powerful features to simplify your{" "}
            <br className="hidden sm:block" />
            web building experience
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <FeatureCard className="lg:col-span-2 ">
            <MockUI />
            <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              AI-Powered Design Assistance
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Get personalized design recommendations with AI-powered tools that
              help you create a polished, professional website effortlessly.
            </p>
          </FeatureCard>

          {/* Card 2 */}
          <FeatureCard>
            <MockUI />
            <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Customizable Templates
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Choose from a wide range of professionally designed templates.
              Easily customize fonts, colors, and layouts to reflect your brand.
            </p>
          </FeatureCard>

          {/* Card 3 */}
          <FeatureCard>
            <PerformanceChart />
            <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              SEO Tools Built-In
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Boost your website’s visibility with integrated SEO tools.
            </p>
          </FeatureCard>

          {/* Card 4 */}
          <FeatureCard>
            <IntegrationMock />
            {/* <OrbitingCircles /> */}
            <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Seamless Integrations
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Easily connect with your favorite apps and services.
            </p>
          </FeatureCard>

          {/* Card 5 */}
          <FeatureCard>
            <ResponsiveMock />
            <h3 className="mt-6 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Responsive Design
            </h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Create websites that look stunning on any device.
            </p>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
