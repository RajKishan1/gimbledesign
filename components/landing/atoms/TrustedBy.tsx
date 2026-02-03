// "use client";
// import * as React from "react";

// import { useInView, useAnimation, motion } from "motion/react";
// import { BASE_TRANSITION, revealAnimationVariants } from "@/lib/animation";

// // import { BASE_TRANSITION, revealAnimationVariants } from "@/utils/animation"

// const TrustedBy: React.FC = () => {
//   const controls = useAnimation();
//   const ref = React.useRef(null);
//   const isInView = useInView(ref, { once: true });

//   React.useEffect(() => {
//     if (isInView) {
//       controls.start("visible").catch((err) => {
//         console.log(err);
//       });
//     }
//   }, [controls, isInView]);

//   return (
//     <section ref={ref}>
//       <motion.p
//         initial="hidden"
//         animate={controls}
//         variants={revealAnimationVariants}
//         transition={{ delay: 0.4, ...BASE_TRANSITION }}
//         className="text-primary text-sm leading-[22px] tracking-tight text-center py-6"
//       ></motion.p>
//       <div className="border-b border-grid" />
//       <motion.div
//         initial="hidden"
//         animate={controls}
//         variants={revealAnimationVariants}
//         transition={{ delay: 0.5, ...BASE_TRANSITION }}
//         className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
//       >
//         <div className="flex py-[33.9px] border-b border-r border-grid items-center justify-center">
//           s
//         </div>
//         <div className="flex py-[29.61px] border-b md:border-r border-grid items-center justify-center">
//           sa
//         </div>
//         <div className="flex py-[33.34px] border-b border-r md:border-r-0 lg:border-r border-grid items-center justify-center">
//           a
//         </div>
//         <div className="flex py-[27.74px] border-b md:border-r border-grid items-center justify-center">
//           f
//         </div>
//         <div className="flex py-[31.29px] border-b border-r border-grid items-center justify-center">
//           t
//         </div>
//         <div className="flex py-[27.94px] border-b border-grid items-center justify-center">
//           p
//         </div>
//       </motion.div>
//     </section>
//   );
// };

// export default TrustedBy;

"use client";
import * as React from "react";

import { useInView, useAnimation, motion } from "motion/react";
import { BASE_TRANSITION, revealAnimationVariants } from "@/lib/animation";

// import { BASE_TRANSITION, revealAnimationVariants } from "@/utils/animation"

const TrustedBy: React.FC = () => {
  const controls = useAnimation();
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  React.useEffect(() => {
    if (isInView) {
      controls.start("visible").catch((err) => {
        console.log(err);
      });
    }
  }, [controls, isInView]);

  const gridVariants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: 0.4,
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <section ref={ref}>
      <div className="border-b border-black/5" />
      <motion.div
        initial="hidden"
        animate={controls}
        variants={gridVariants}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
      >
        <motion.div
          variants={revealAnimationVariants}
          transition={BASE_TRANSITION}
          className="flex py-[33.9px] border-b border-r border-black/5 items-center justify-center"
        >
          s
        </motion.div>
        <motion.div
          variants={revealAnimationVariants}
          transition={BASE_TRANSITION}
          className="flex py-[29.61px] border-b md:border-r border-black/5 items-center justify-center"
        >
          sa
        </motion.div>
        <motion.div
          variants={revealAnimationVariants}
          transition={BASE_TRANSITION}
          className="flex py-[33.34px] border-b border-r md:border-r-0 lg:border-r border-black/5 items-center justify-center"
        >
          a
        </motion.div>
        <motion.div
          variants={revealAnimationVariants}
          transition={BASE_TRANSITION}
          className="flex py-[27.74px] border-b md:border-r border-black/5 items-center justify-center"
        >
          f
        </motion.div>
        <motion.div
          variants={revealAnimationVariants}
          transition={BASE_TRANSITION}
          className="flex py-[31.29px] border-b border-r border-black/5 items-center justify-center"
        >
          t
        </motion.div>
        <motion.div
          variants={revealAnimationVariants}
          transition={BASE_TRANSITION}
          className="flex py-[27.94px] border-b border-black/5 items-center justify-center"
        >
          p
        </motion.div>
      </motion.div>
    </section>
  );
};

export default TrustedBy;