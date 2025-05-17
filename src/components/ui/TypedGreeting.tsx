import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const LOCAL_STORAGE_KEY_GREETING = 'hasShownTypedGreeting';

/**
 * Props for the TypedGreeting component.
 *
 * @interface TypedGreetingProps
 */
interface TypedGreetingProps {
  /** The text to be displayed with a typing animation. */
  text: string;
  /** The speed of the typing animation in milliseconds per character. Defaults to 50. */
  speed?: number;
  /** Additional CSS class names for the component. */
  className?: string;
  /** 
   * Object containing start and end colors for the text gradient.
   * Defaults to blue and purple.
   */
  gradientColors?: {
    start: string;
    end: string;
  };
}

/**
 * TypedGreeting component.
 *
 * Displays text with a typing animation and an animated gradient effect.
 * Includes a blinking cursor during the typing animation.
 * Uses Framer Motion for animations.
 * Will only show the typing animation on the first visit.
 *
 * @param {TypedGreetingProps} props - The props for the component.
 * @returns {JSX.Element} The rendered TypedGreeting component.
 */
export function TypedGreeting({ 
  text, 
  speed = 50, 
  className = "",
  gradientColors = {
    start: '#1D4ED8', // Default blue
    end: '#6B21A8'    // Default purple
  }
}: TypedGreetingProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const hasBeenShown = localStorage.getItem(LOCAL_STORAGE_KEY_GREETING);
    if (!hasBeenShown) {
      setShouldAnimate(true);
      // Mark as shown for subsequent visits. 
      // We can set this immediately or after the animation completes.
      // Setting it immediately is simpler.
      localStorage.setItem(LOCAL_STORAGE_KEY_GREETING, 'true');
    } else {
      setShouldAnimate(false);
      setDisplayText(text); // Show full text immediately
    }
  }, [text]); // Rerun if text changes, though for greeting it might be static

  useEffect(() => {
    // Only run typing animation if shouldAnimate is true
    if (shouldAnimate && currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    }
  }, [shouldAnimate, currentIndex, text, speed]);

  return (
    <div className={`typed-greeting ${className}`} style={{ minHeight: '1.2em', display: 'inline-block' }}>
      <motion.span
        className="inline-block"
        style={{
          background: `linear-gradient(to right, ${gradientColors.start}, ${gradientColors.end})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          position: 'relative',
          minWidth: '1ch', // Minimum width to prevent jumping
        }}
        animate={{
          backgroundImage: [
            `linear-gradient(to right, ${gradientColors.start}, ${gradientColors.end})`,
            `linear-gradient(to right, ${gradientColors.end}, ${gradientColors.start})`,
            `linear-gradient(to right, ${gradientColors.start}, ${gradientColors.end})`
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        {displayText}
        {/* Use an absolutely positioned cursor that does not affect the layout */}
        {shouldAnimate && currentIndex < text.length && (
          <motion.span
            className="cursor"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ 
              position: 'absolute',
              top: 0,
              right: '-4px', // Position to the right of the text
              display: 'inline-block',
              width: '2px',
              height: '1em',
              background: `linear-gradient(to right, ${gradientColors.start}, ${gradientColors.end})`,
              verticalAlign: 'middle'
            }}
          />
        )}
        {/* Invisible placeholder containing the full text to define the size */}
        <span 
          style={{
            position: 'absolute', 
            visibility: 'hidden', 
            pointerEvents: 'none',
            height: 0,
            overflow: 'hidden',
            whiteSpace: 'pre'
          }}
          aria-hidden="true"
        >
          {text}
        </span>
      </motion.span>
    </div>
  );
} 