"use client";

import { motion } from "framer-motion";

export default function Background() {
    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#0a0a0a]">
            {/* Radiant Orbs - Smoother Animation */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 45, 0],
                    opacity: [0.3, 0.4, 0.3]
                }}
                transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-[#00B050] blur-[120px] opacity-30"
            />

            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    opacity: [0.2, 0.3, 0.2]
                }}
                transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[40%] -right-[20%] w-[60vw] h-[60vw] rounded-full bg-[#0052A4] blur-[120px] opacity-20"
            />

            <motion.div
                animate={{
                    scale: [1, 1.05, 1],
                    y: [0, -30, 0],
                }}
                transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-[#996CAC] blur-[150px] opacity-10"
            />

            {/* Grid Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}
            />
        </div>
    );
}
