import React, { useRef, useEffect } from "react";

const LogoRadarPulse = ({
  size = 240,
  color = "#4a90e2",
  pulseColor = "#50b4ff",
  pulseCount = 1,
  duration = 2400, // Increased duration to make the pulse happen less often
  gap = 800, // Added gap to introduce a delay between pulses
  style = {},
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = size;
    canvas.height = size;

    function draw(now) {
      const totalCycle = duration + gap; // Total time for one pulse cycle including the gap
      const cycleTime = now % totalCycle;

      ctx.clearRect(0, 0, size, size);

      if (cycleTime < duration) { // Only draw the pulse during the active duration
        // Draw soft white radial gradient glow behind everything
        const glow = ctx.createRadialGradient(
          size / 2,
          size / 2,
          0,
          size / 2,
          size / 2,
          size / 2 - 10
        );
        glow.addColorStop(0, "rgba(255,255,255,0.18)");
        glow.addColorStop(0.5, "rgba(255,255,255,0.10)");
        glow.addColorStop(1, "rgba(255,255,255,0.01)");
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 10, 0, 2 * Math.PI);
        ctx.fillStyle = glow;
        ctx.filter = "blur(18px)";
        ctx.fill();
        ctx.filter = "none";
        ctx.restore();

        for (let i = 0; i < pulseCount; i++) {
          const t = ((cycleTime + (i * duration) / pulseCount) % duration) / duration;
          const r = 60 + t * (size / 2 - 20);
          const alpha = 0.25 * (1 - t);
          ctx.save();
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, r, 0, 2 * Math.PI);
          ctx.strokeStyle = pulseColor;
          ctx.globalAlpha = alpha;
          ctx.lineWidth = 8;
          ctx.shadowColor = pulseColor;
          ctx.shadowBlur = 24;
          ctx.stroke();
          ctx.restore();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    }

    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [size, pulseColor, pulseCount, duration, gap]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 1,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export default LogoRadarPulse;
