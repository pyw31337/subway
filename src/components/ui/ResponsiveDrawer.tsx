"use client";

import { useRef, useEffect } from "react";

interface ResponsiveDrawerProps {
    isOpen: boolean;         // For mobile sheet state
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode; // Content inside the drawer
    desktopSidebarContent?: React.ReactNode; // Content for Desktop Sidebar
    hasResult: boolean;      // To control height on mobile
}

export default function ResponsiveDrawer({
    isOpen,
    onOpenChange,
    children,
    desktopSidebarContent,
    hasResult
}: ResponsiveDrawerProps) {

    // --- Mobile Drag Logic ---
    // (Simplified for now, can add robust swipe later if needed)

    return (
        <>
            {/* === MOBILE LAYOUT (Bottom Sheet) === */}
            <div className="md:hidden fixed bottom-0 left-0 w-full z-[5000] pointer-events-none flex flex-col justify-end">
                <div
                    className="pointer-events-auto w-full bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-8 pt-1 rounded-t-[24px] overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                    style={{
                        maxHeight: isOpen || hasResult ? '80vh' : 'auto',
                        // If closed & no result: auto/small. If open or has result: tall.
                    }}
                >
                    {/* Drag Handle */}
                    <div
                        className="w-full flex justify-center py-3 cursor-grab active:cursor-grabbing touch-pan-y"
                        onClick={() => onOpenChange(!isOpen)}
                    >
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                    </div>

                    <div className="px-5 pb-6">
                        {children}
                    </div>
                </div>
            </div>

            {/* === DESKTOP LAYOUT (Left Sidebar) === */}
            <div className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-[400px] z-[5000] bg-white shadow-[4px_0_24px_rgba(0,0,0,0.06)] border-r border-gray-100 font-sans">
                {desktopSidebarContent || children}
            </div>
        </>
    );
}
