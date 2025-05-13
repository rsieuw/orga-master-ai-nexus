import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface ConfettiAnimationProps {
  show: boolean;
  text?: string;
  duration?: number;
  onComplete?: () => void;
}

export function ConfettiAnimation({ 
  show, 
  text = "Nieuw!", 
  duration = 2000,
  onComplete
}: ConfettiAnimationProps) {
  const [visible, setVisible] = useState(show);
  
  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);
  
  // Genereer confetti deeltjes
  const generateConfetti = (count = 20) => {
    return Array.from({ length: count }).map((_, i) => {
      const size = Math.random() * 6 + 2; // 2-8px
      const angle = Math.random() * 360; // willekeurige hoek
      const x = (Math.random() - 0.5) * 60; // spreiding -30 tot 30px
      const y = (Math.random() - 0.5) * 60; // spreiding -30 tot 30px
      
      return (
        <motion.div
          key={i}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            scale: 1,
            x: x,
            y: y,
            rotate: angle
          }}
          transition={{ 
            duration: 1 + Math.random(), 
            ease: "easeOut" 
          }}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: Math.random() > 0.5 ? "50%" : "0%",
            backgroundColor: ["#FF5252", "#FFD740", "#448AFF", "#69F0AE", "#E040FB"][Math.floor(Math.random() * 5)]
          }}
        />
      );
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className="absolute left-0 top-0 right-0 bottom-0 z-50 flex items-center justify-center pointer-events-none"
        >
          {/* Confetti container */}
          <div className="absolute inset-0 overflow-visible flex items-center justify-center">
            {generateConfetti()}
          </div>
          
          {/* Tekst */}
          <motion.div
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            className="px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white font-medium rounded-md text-sm whitespace-nowrap"
          >
            {text}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfettiAnimation; 