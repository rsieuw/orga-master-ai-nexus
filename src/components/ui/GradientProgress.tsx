import React from 'react';
import { cn } from '@/lib/utils.ts';

interface GradientProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  showPercentage?: boolean;
}

const GradientProgress = React.forwardRef<HTMLDivElement, GradientProgressProps>(
  ({ className, value, showPercentage = false, ...props }, ref) => {
    const progress = Math.max(0, Math.min(100, value || 0)); // Clamp value between 0 and 100
    
    // Calculate end hue based on progress (0=red, 60=yellow, 120=green)
    const endHue = progress * 1.2;
    // Calculate start hue, slightly earlier, clamping at red (0)
    const startHue = Math.max(0, endHue - 20); 

    // Create dynamic gradient string
    const gradientStyle = `linear-gradient(to right, hsl(${startHue}, 90%, 50%), hsl(${endHue}, 90%, 50%))`;

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-1.5 w-full overflow-hidden rounded-full bg-muted progress-bg', // Added progress-bg class
          className
        )}
        {...props}
      >
        <div
          className="h-full w-full flex-1 transition-all duration-300 ease-out progress-fill"
          style={{
            width: `${progress}%`, // Dynamic width
            backgroundImage: gradientStyle // Apply dynamic gradient
          }}
        />
        {showPercentage && progress > 10 && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-white font-bold select-none">
            {Math.round(progress)}%
          </span>
        )}
      </div>
    );
  }
);
GradientProgress.displayName = 'GradientProgress';

export { GradientProgress }; 