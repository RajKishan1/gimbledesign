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
        rounded-2xl border border-border
        bg-card
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
      <div className="h-40 rounded-xl bg-muted border border-border p-4 flex items-end gap-2">
        {[40, 70, 55, 80, 60].map((h, i) => (
          <div
            key={i}
            className="w-6 rounded-md bg-primary/80"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    );
  }
  function IntegrationMock() {
    return (
      <div className="h-40 rounded-xl bg-muted border border-border flex items-center justify-center">
        <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-primary" />
        </div>
      </div>
    );
  }

  const ResponsiveMock: React.FC = () => {
    return (
      <div className="relative w-full h-64 bg-muted border border-border flex items-center justify-center rounded-xl">
        {/* Desktop Mockup */}
        <div className="relative z-0 w-72 h-48 md:w-96 md:h-64 bg-card border border-border rounded-t-xl shadow-lg p-4 flex flex-col gap-2">
          {/* Accent Dot */}
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          {/* Search Bar */}
          <div className="w-full h-4 bg-muted rounded-full"></div>
          {/* Text Line */}
          <div className="w-3/4 h-3 bg-muted rounded-full"></div>
          {/* Accent Button */}
          <div className="w-20 h-6 bg-primary rounded-full "></div>
          {/* Content Area */}
          <div className="w-full flex-1 bg-muted rounded"></div>
        </div>

        {/* Mobile Mockup */}
        <div className="absolute z-10 bottom-15 right-10 w-32 h-48 md:w-32 md:h-56 bg-card border border-border rounded-3xl shadow-lg p-3 flex flex-col gap-1.5 translate-x-1/4 translate-y-1/4 md:translate-x-1/3 md:translate-y-1/3">
          {/* Accent Dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
          {/* Search Bar */}
          <div className="w-full h-3 bg-muted rounded-full"></div>
          {/* Text Line */}
          <div className="w-3/4 h-2 bg-muted rounded-full"></div>
          {/* Accent Button */}
          <div className="w-16 h-4 bg-primary rounded-full self-center"></div>
          {/* Content Area */}
          <div className="w-full flex-1 bg-muted rounded"></div>
        </div>
      </div>
    );
  };

  function MockUI() {
    return (
      <div className="h-40 rounded-xl bg-muted border border-border flex items-center justify-center">
        <div className="w-3/4 h-4 bg-accent rounded" />
      </div>
    );
  }

  return (
    <section className="relative py-20 bg-background border border-border transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-sm font-medium tracking-wide text-primary">
            FEATURES
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-foreground">
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
            <h3 className="mt-6 text-lg font-semibold text-foreground">
              AI-Powered Design Assistance
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get personalized design recommendations with AI-powered tools that
              help you create a polished, professional website effortlessly.
            </p>
          </FeatureCard>

          {/* Card 2 */}
          <FeatureCard>
            <MockUI />
            <h3 className="mt-6 text-lg font-semibold text-foreground">
              Customizable Templates
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose from a wide range of professionally designed templates.
              Easily customize fonts, colors, and layouts to reflect your brand.
            </p>
          </FeatureCard>

          {/* Card 3 */}
          <FeatureCard>
            <PerformanceChart />
            <h3 className="mt-6 text-lg font-semibold text-foreground">
              SEO Tools Built-In
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Boost your website&apos;s visibility with integrated SEO tools.
            </p>
          </FeatureCard>

          {/* Card 4 */}
          <FeatureCard>
            <IntegrationMock />
            <h3 className="mt-6 text-lg font-semibold text-foreground">
              Seamless Integrations
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Easily connect with your favorite apps and services.
            </p>
          </FeatureCard>

          {/* Card 5 */}
          <FeatureCard>
            <ResponsiveMock />
            <h3 className="mt-6 text-lg font-semibold text-foreground">
              Responsive Design
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create websites that look stunning on any device.
            </p>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}
