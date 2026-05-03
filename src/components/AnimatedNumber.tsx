import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

export function AnimatedNumber({ value, format = (v: number) => v.toString() }: { value: number, format?: (v: number) => string }) {
  const [displayValue, setDisplayValue] = useState(format(0));
  const spring = useSpring(0, { bounce: 0, duration: 600 });
  
  useEffect(() => {
    return spring.on("change", (latest) => {
      setDisplayValue(format(Math.floor(latest)));
    });
  }, [spring, format]);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <span className="tabular-nums">{displayValue}</span>;
}
