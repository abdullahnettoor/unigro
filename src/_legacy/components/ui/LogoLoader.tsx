import { cn } from "@/lib/utils";

interface LogoLoaderProps {
    size?: "sm" | "md" | "lg" | "xl" | "2xl";
    className?: string;
}

export function LogoLoader({ size = "md", className }: LogoLoaderProps) {
    const sizeClasses = {
        sm: "w-6 h-6",
        md: "w-10 h-10",
        lg: "w-16 h-16",
        xl: "w-24 h-24",
        "2xl": "w-32 h-32",
    }[size];

    const pathRight = "M198.3.63c3-1.77,6.78.39,6.78,3.87v152.39c-2.61,43.57-40.55,86.99-89.81,96.95-19.47,3.39-38.34,2.67-55-1.39,10.42-3.46,20.04-7.55,28.98-12.35,20.19-10.82,36.8-25.34,48.94-42.65,4.36-6.2,8.15-12.76,11.3-19.64,7.64-16.6,11.85-36.1,11.85-54.91V42.56c0-12.46,6.58-23.98,17.31-30.32L198.3.63Z";
    const pathMiddle = "M108.88,53.43c-10.72,6.33-17.31,17.86-17.31,30.32v39.16c0,8.69-2.04,18.31-5.46,25.74-10.46,22.75-34.6,37.12-73.8,43.95-4.11.71-8.22,1.22-12.32,1.51.1,1.11.22,2.24.38,3.35.07.54.16,1.08.26,1.62,2.54,14.39,10.8,26.78,22.95,36.29,20.93-3.94,38.46-9.8,53.53-17.87,10.42-5.59,19.66-12.32,27.52-20.04,9.09-8.92,16.36-19.14,21.53-30.36,6.13-13.31,9.5-29,9.5-44.19V45.48c0-3.48-3.78-5.64-6.78-3.87l-20.01,11.82Z";
    const pathLeft = "M34.04,97.62c-7.76,4.58-13.47,11.97-15.95,20.64l-14.2,49.67h0c1.34-.17,2.68-.38,4.02-.61,29.85-5.2,48.32-15.09,54.91-29.4,1.86-4.04,3.11-10.07,3.11-15.01v-36.24c0-3.48-3.78-5.64-6.78-3.87l-25.1,14.82Z";

    // A: Left-to-Right Pulse
    return (
        <svg viewBox="0 0 205.08 256" className={cn(sizeClasses, "fill-current text-[var(--accent-vivid)]", className)}>
            <path d={pathLeft} className="animate-logo-pulse" style={{ animationDelay: "0ms" }} />
            <path d={pathMiddle} className="animate-logo-pulse" style={{ animationDelay: "300ms" }} />
            <path d={pathRight} className="animate-logo-pulse" style={{ animationDelay: "600ms" }} />
        </svg>
    );
}
