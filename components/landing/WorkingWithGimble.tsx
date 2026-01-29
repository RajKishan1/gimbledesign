// import React from "react";

// const textItems = [
//   "Write a single prompt",
//   "Auto-structured layouts",
//   "Edit and refine instantly",
//   "Copy to Figma-ready layout",
//   "Ship faster with confidence",
//   "Built-in design consistency",
// ];

// type ListItemProps = {
//   text: string;
// };

// export const ListItem = ({ text }: ListItemProps) => {
//   return (
//     <div className="flex items-center gap-2">
//       <div className="w-2 h-2 rounded-full bg-black"></div>
//       <p>{text}</p>
//     </div>
//   );
// };

// const WorkingWithGimble = () => {
//   return (
//     <div className="flex flex-col md:flex-row gap-4">
//       <h2>Working with Gimble</h2>

//       <div className="relative flex flex-col gap-2">
//         <div className="absolute top-0 w-full h-20 bg-linear-to-b from-white via-0% to-transparent"></div>
//         <div className="absolute bottom-0 w-full h-20 bg-linear-to-t from-white via-0% to-transparent"></div>
//         {textItems.map((item, index) => (
//           <ListItem key={index} text={item} />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default WorkingWithGimble;

"use client";
import React from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationFrame,
} from "framer-motion";
import { Check } from "lucide-react";

const textItems = [
  "Write a single prompt",
  "Auto-structured layouts",
  "Edit and refine instantly",
  "Copy to Figma-ready layout",
  "Ship faster with confidence",
  "Built-in design consistency",
];

const ITEM_HEIGHT = 50; // px (match your ListItem height)
const VISIBLE_HEIGHT = 280; // container height

const ListItem = ({
  text,
  index,
  baseY,
}: {
  text: string;
  index: number;
  baseY: any;
}) => {
  const itemY = useTransform(baseY, (v: any) => {
    const totalHeight = textItems.length * ITEM_HEIGHT;
    const y =
      (((v + index * ITEM_HEIGHT) % totalHeight) + totalHeight) % totalHeight;
    return y;
  });

  // const scale = useTransform(
  //   itemY,
  //   [0, VISIBLE_HEIGHT / 2, VISIBLE_HEIGHT],
  //   [0.75, 1, 0.75],
  // );

  const opacity = useTransform(
    itemY,
    [0, VISIBLE_HEIGHT / 2, VISIBLE_HEIGHT],
    [0.4, 1, 0.4],
  );

  return (
    <motion.div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        y: itemY,

        opacity,
      }}
      className="flex h-20  items-center justify-center text-sm font-medium text-gray-700"
    >
      <span className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center text-white p-1">
        <Check />
      </span>{" "}
      <p className="text-lg font-normal px-2">{text}</p>
    </motion.div>
  );
};

const WorkingWithGimble = () => {
  const baseY = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    baseY.set(baseY.get() - delta * 0.07); // smoother speed
  });

  return (
    <div className="flex py-40 w-full items-center justify-center bg-gray-50 p-8">
      <div className="text-center w-full flex items-center">
        <h2 className="mb-8 text-3xl font-bold text-gray-900">
          Working with Gimble
        </h2>

        <div
          className="relative mx-auto h-80 w-full max-w-md overflow-hidden "
          style={{ perspective: "500px" }}
        >
          {/* Fade masks */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-linear-to-b from-gray-50 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-linear-to-t from-gray-50 to-transparent" />

          {[...textItems, ...textItems].map((text, index) => (
            <ListItem key={index} text={text} index={index} baseY={baseY} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkingWithGimble;
