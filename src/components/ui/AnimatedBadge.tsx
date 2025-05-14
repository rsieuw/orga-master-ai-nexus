import { Badge } from "@/components/ui/badge.tsx";
import { motion } from "framer-motion";
import { ReactNode, useEffect, useState } from "react";

interface AnimatedBadgeProps {
  children: ReactNode;
  className?: string;
  sparkleEffect?: boolean;
}

export function AnimatedBadge({ 
  children, 
  className = "", 
  sparkleEffect = true
}: AnimatedBadgeProps) {
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  
  // Genereer sparkles effect bij het monteren
  useEffect(() => {
    if (sparkleEffect) {
      const newSparkles = Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100, // positie in % van parent
        y: Math.random() * 100, // positie in % van parent
        size: Math.random() * 5 + 2, // grootte 2-7px
      }));
      setSparkles(newSparkles);
    }
  }, [sparkleEffect]);

  return (
    <div className="relative inline-flex">
      {/* Basis Badge met zoom effect */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20,
          duration: 0.5
        }}
      >
        <Badge className={`text-white border-0 badge text-[10px] px-2 py-0 h-5 rounded-full backdrop-blur-sm shadow-md ${className}`} 
               style={{ 
                 background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.7), rgba(79, 70, 229, 0.7))',
                 fontWeight: '600',
                 backdropFilter: 'blur(4px)'
               }}>
          {children}
        </Badge>
      </motion.div>

      {/* Sparkles */}
      {sparkleEffect && sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute rounded-full bg-white pointer-events-none opacity-0"
          style={{
            width: sparkle.size,
            height: sparkle.size,
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: [0, (Math.random() - 0.5) * 15],
            y: [0, (Math.random() - 0.5) * 15],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "loop",
            delay: Math.random() * 2,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export default AnimatedBadge; 