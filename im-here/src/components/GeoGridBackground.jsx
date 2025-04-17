import React, { useRef, useEffect } from "react";

// Utility to generate random pings
function randomPings(gridW, gridH, count) {
  const minDist = 2; // Minimum grid cells apart
  const pings = [];
  let attempts = 0;

  // Ensure at least one ping per quadrant if possible
  const quadrants = [
    { xMin: 0, xMax: Math.floor(gridW / 2), yMin: 0, yMax: Math.floor(gridH / 2) }, // Top-left
    { xMin: Math.floor(gridW / 2), xMax: gridW, yMin: 0, yMax: Math.floor(gridH / 2) }, // Top-right
    { xMin: 0, xMax: Math.floor(gridW / 2), yMin: Math.floor(gridH / 2), yMax: gridH }, // Bottom-left
    { xMin: Math.floor(gridW / 2), xMax: gridW, yMin: Math.floor(gridH / 2), yMax: gridH }, // Bottom-right
  ];
  for (let q = 0; q < 4 && pings.length < count; q++) {
    const quad = quadrants[q];
    const candidate = {
      x: quad.xMin + Math.floor(Math.random() * Math.max(1, quad.xMax - quad.xMin)),
      y: quad.yMin + Math.floor(Math.random() * Math.max(1, quad.yMax - quad.yMin)),
      t: Math.random() * 20000,
      speed: 10000 + Math.random() * 10000,
    };
    pings.push(candidate);
  }

  // Fill the rest randomly, avoiding too-close pings
  while (pings.length < count && attempts < count * 50) {
    const candidate = {
      x: Math.floor(Math.random() * gridW),
      y: Math.floor(Math.random() * gridH),
      t: Math.random() * 20000, // Staggered initial delay
      speed: 10000 + Math.random() * 10000, // Each pulse lasts 10-20 seconds, so pulses are less frequent
    };
    let tooClose = false;
    for (let i = 0; i < pings.length; i++) {
      const dx = candidate.x - pings[i].x;
      const dy = candidate.y - pings[i].y;
      if (Math.sqrt(dx * dx + dy * dy) < minDist) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) {
      pings.push(candidate);
    }
    attempts++;
  }
  return pings;
}

const GeoGridBackground = ({
  gridSize = 60, // Increased gridSize for more spread out dots
  dotCount = 4,
  style = {},
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef();
  const pingsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;
    const gridW = Math.floor(width / gridSize);
    const gridH = Math.floor(height / gridSize);
    pingsRef.current = randomPings(gridW, gridH, dotCount);

    function drawGrid() {
      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(100,150,220,0.10)";
      ctx.lineWidth = 1;
      // Draw vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      // Draw horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawPings(now) {
      pingsRef.current.forEach((ping, i) => {
        const px = ping.x * gridSize + gridSize / 2;
        const py = ping.y * gridSize + gridSize / 2;
        const t = ((now + ping.t) % ping.speed) / ping.speed;
        // Pulse: radius grows and fades
        const maxR = gridSize * 8; // Reduced pulse travel distance
        const r = 6 + t * maxR;
        const alpha = 0.07 * (1 - t); // Lowered opacity for subtlety
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, r, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(80,180,255,${alpha})`;
        ctx.lineWidth = 1.5; // Thinner line
        ctx.shadowColor = "#50b4ff";
        ctx.shadowBlur = 2; // Softer shadow
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, 2 * Math.PI);
        ctx.fillStyle = "#4a90e2";
        ctx.shadowColor = "#4a90e2";
        ctx.shadowBlur = 4; // Softer glow
        ctx.globalAlpha = 0.5; // Lower dot opacity
        ctx.fill();
        ctx.restore();
      });
    }

    function animate(now) {
      drawGrid();
      drawPings(now);
      animationRef.current = requestAnimationFrame(animate);
    }
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [gridSize, dotCount]);

  // Responsive resize
  useEffect(() => {
    function handleResize() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1,
        ...style,
      }}
      aria-hidden="true"
    />
  );
};

export default GeoGridBackground;
