import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, speed]);

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
          minWidth: '1ch', // Minimale breedte om verspringing te voorkomen
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
        {/* Gebruik een absolute gepositioneerde cursor die niet de layout beïnvloedt */}
        {currentIndex < text.length && (
          <motion.span
            className="cursor"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ 
              position: 'absolute',
              top: 0,
              right: '-4px', // Positioneer rechts van de tekst
              display: 'inline-block',
              width: '2px',
              height: '1em',
              background: `linear-gradient(to right, ${gradientColors.start}, ${gradientColors.end})`,
              verticalAlign: 'middle'
            }}
          />
        )}
        {/* Onzichtbare placeholder die de volledige tekst bevat om de grootte te definiëren */}
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