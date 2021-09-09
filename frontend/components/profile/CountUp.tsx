import clsx from "clsx";
import { makeStyles } from "@material-ui/core";
import { useState, useRef, useEffect } from "react";

const useStyles = makeStyles((theme) => ({
  base: {
    fontSize: "1.5em",
    transition: "color 500ms ease-in-out",
  },
  textRed: {
    color: "#DC2626",
  },
  textBlue: {
    color: "#2563EB",
  },
  textPurple: {
    color: "#7C3AED",
  },
  textCyan: {
    color: "#0891B2",
  },
  glow: {
    filter: "drop-shadow(0 0 2px #DC262677)",
  },
}));

const STEP = 1;
const CountUp = ({ to }: { to: number }) => {
  const classes = useStyles();
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    setCurrent(0);

    const loop = () => {
      setCurrent((currentCount) => {
        if (currentCount + STEP >= to) {
          return to;
        }

        return currentCount + STEP;
      });

      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [to]);

  return (
    <span
      className={clsx(classes.base, {
        [classes.textCyan]: current <= 50,
        [classes.textBlue]: current > 50 && current <= 75,
        [classes.textPurple]: current > 75 && current < 100,
        [classes.textRed]: current >= 100,
        [classes.glow]: current >= 100,
      })}
    >
      {current}%
    </span>
  );
};

export default CountUp;
