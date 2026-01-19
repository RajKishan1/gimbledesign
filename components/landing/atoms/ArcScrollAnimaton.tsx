import React, { useEffect, useRef, useState } from "react";

interface Project {
  id: number;
  title: string;
  description: string;
}

interface ProjectCardProps {
  project: Project;
  style?: React.CSSProperties;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, style }) => (
  <div
    className="bg-gray-900 border border-gray-700 p-6 rounded-lg shadow-lg hover:shadow-xl hover:border-gray-600 transition-all duration-300"
    style={style}
  >
    <h3 className="font-semibold text-xl mb-2 text-gray-100">
      {project.title}
    </h3>
    <p className="text-gray-400 text-sm">{project.description}</p>
  </div>
);

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = "",
  variant,
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 border transition-all duration-300 ${
      variant === "outline"
        ? "bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-500"
        : "bg-blue-600 text-white hover:bg-blue-700"
    } ${className}`}
  >
    {children}
  </button>
);

const ArcScrollAnimation: React.FC = () => {
  const [showAllProjects, setShowAllProjects] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const allProjects: Project[] = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `Project ${i + 1}`,
    description: `This is a description for project ${i + 1}. Showcasing innovative solutions and creative designs.`,
  }));

  const projects = showAllProjects ? allProjects : allProjects.slice(0, 9);

  useEffect(() => {
    const handleScroll = (): void => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const distanceFromBottom = windowHeight - rect.bottom;
      const progress = Math.max(
        0,
        Math.min(1, distanceFromBottom / windowHeight),
      );

      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getCardStyle = (index: number, total: number): React.CSSProperties => {
    const width = window.innerWidth;
    const cols = width >= 768 ? 3 : width >= 640 ? 2 : 1;
    const row = Math.floor(index / cols);
    const col = index % cols;

    // Responsive arc parameters
    const arcHeight = width >= 768 ? 120 : width >= 640 ? 80 : 60;
    const arcWidth = width >= 768 ? 200 : width >= 640 ? 150 : 100;

    const positionInRow = (col - (cols - 1) / 2) / Math.max(cols - 1, 1);

    const arcOffset = arcHeight * (1 - Math.pow(positionInRow * 2, 2));
    const horizontalSpread = positionInRow * arcWidth;

    const translateY = arcOffset * (1 - scrollProgress);
    const translateX = horizontalSpread * (1 - scrollProgress);
    const rotateZ = positionInRow * 5 * (1 - scrollProgress);
    const scale = 1 - 0.05 * Math.abs(positionInRow) * (1 - scrollProgress);

    return {
      transform: `translate(${translateX}px, ${translateY}px) rotateZ(${rotateZ}deg) scale(${scale})`,
      transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      transformOrigin: "center center",
    };
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero Section */}
      <div className="h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
            Scroll Down
          </h1>
          <p className="text-lg md:text-xl text-gray-400">
            Watch the arc animation in action
          </p>
        </div>
      </div>

      {/* Projects Section */}
      <div
        ref={containerRef}
        className="px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24 py-12"
      >
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
          Our Projects
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-6">
          {projects?.map((project, index) => (
            <div key={project.id} style={getCardStyle(index, projects.length)}>
              <ProjectCard project={project} />
            </div>
          ))}
        </div>

        {!showAllProjects && projects && projects.length >= 9 && (
          <div className="flex justify-center mt-8 md:mt-12">
            <Button
              variant="outline"
              onClick={() => setShowAllProjects(true)}
              className="px-6 py-3 rounded-lg text-base md:text-lg font-medium"
            >
              Show All Projects
            </Button>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-xl md:text-2xl text-gray-400">
            Scroll back up to see the cards return to arc formation
          </p>
          <div className="mt-6 text-sm text-gray-600">
            Progress: {Math.round(scrollProgress * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArcScrollAnimation;
