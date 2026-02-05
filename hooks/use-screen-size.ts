import { useState, useEffect } from "react";

export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
};

export const useScreenSize = () => {
    const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 0);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const lessThan = (breakpoint: Breakpoint) => {
        return width < breakpoints[breakpoint];
    };

    const greaterThan = (breakpoint: Breakpoint) => {
        return width >= breakpoints[breakpoint];
    };

    return { width, lessThan, greaterThan };
};

export default useScreenSize;
