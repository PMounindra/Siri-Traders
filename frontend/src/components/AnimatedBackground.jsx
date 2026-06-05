import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './AnimatedBackground.css';

const GROCERIES = [
  '🥕', '🍎', '🥦', '🍞', '🥛', '🧅', '🍌', '🥚',
  '🍅', '🫑', '🥒', '🧀', '🍇', '🥑', '🍊', '🥭',
  '🧄', '🥬', '🍋', '🧈', '🌽', '🍓', '🫐', '🥜',
];

const PARTICLE_COUNT = 34;

const AnimatedBackground = () => {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);
  const location = useLocation();

  const hiddenRoutes = ['/login', '/signup'];
  const isHidden = hiddenRoutes.includes(location.pathname);

  useEffect(() => {
    if (isHidden) return undefined;

    const container = containerRef.current;
    if (!container) return;

    // Create particle elements
    const particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const el = document.createElement('span');
      el.className = 'abg__particle';
      const emoji = GROCERIES[Math.floor(Math.random() * GROCERIES.length)];
      el.textContent = emoji;
      
      const size = 24 + Math.random() * 26;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const depth = 0.3 + Math.random() * 0.7;
      
      el.style.fontSize = `${size}px`;
      el.style.left = `${x}%`;
      el.style.top = `${y}%`;
      el.style.opacity = '0';

      container.appendChild(el);

      particles.push({
        el,
        x: x / 100 * window.innerWidth,
        y: y / 100 * window.innerHeight,
        baseX: x / 100 * window.innerWidth,
        baseY: y / 100 * window.innerHeight,
        size,
        speedX: (Math.random() - 0.5) * 0.46,
        speedY: (Math.random() - 0.5) * 0.34 - 0.1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.6,
        baseOpacity: 0.14 + Math.random() * 0.11,
        depth,
        phase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;

    // Fade in
    requestAnimationFrame(() => {
      particles.forEach(p => {
        p.el.style.opacity = String(p.baseOpacity);
      });
    });

    // Mouse/touch tracking
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    const handleTouchMove = (e) => {
      if (e.touches[0]) {
        mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const handleTouchEnd = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    let time = 0;
    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    const animate = () => {
      time += 0.012;

      particles.forEach((p) => {
        // Floating wave
        const floatX = Math.sin(time * 0.6 + p.phase) * 25 * p.depth;
        const floatY = Math.cos(time * 0.4 + p.phase) * 18 * p.depth;

        // Drift
        p.baseX += p.speedX;
        p.baseY += p.speedY;

        // Wrap
        if (p.baseX < -60) p.baseX = w() + 60;
        if (p.baseX > w() + 60) p.baseX = -60;
        if (p.baseY < -60) p.baseY = h() + 60;
        if (p.baseY > h() + 60) p.baseY = -60;

        // Cursor repel
        const mouse = mouseRef.current;
        const dx = (p.baseX + floatX) - mouse.x;
        const dy = (p.baseY + floatY) - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = 160 * p.depth;

        let repelX = 0;
        let repelY = 0;
        if (dist < repelRadius && dist > 0) {
          const force = (1 - dist / repelRadius) * 80 * p.depth;
          repelX = (dx / dist) * force;
          repelY = (dy / dist) * force;
        }

        const finalX = p.baseX + floatX + repelX;
        const finalY = p.baseY + floatY + repelY;
        p.rotation += p.rotationSpeed;

        // Apply with transform (GPU accelerated)
        p.el.style.transform = `translate(${finalX}px, ${finalY}px) rotate(${p.rotation}deg)`;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      // Clean up DOM elements
      particles.forEach(p => p.el.remove());
    };
  }, [isHidden]);

  if (isHidden) return null;

  return (
    <div
      ref={containerRef}
      className="abg"
      aria-hidden="true"
    />
  );
};

export default AnimatedBackground;
