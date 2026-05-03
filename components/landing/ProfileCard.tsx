"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

const DEFAULT_INNER_GRADIENT = "linear-gradient(145deg,#60496e8c 0%,#71C4FF44 100%)";

const ANIMATION_CONFIG = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  DEVICE_BETA_OFFSET: 20,
  ENTER_TRANSITION_MS: 180,
};

type ProfileCardProps = {
  avatarUrl?: string;
  iconUrl?: string;
  grainUrl?: string;
  innerGradient?: string;
  behindGlowEnabled?: boolean;
  behindGlowColor?: string;
  behindGlowSize?: string;
  className?: string;
  enableTilt?: boolean;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  showUserInfo?: boolean;
  cardHeight?: string;
  onContactClick?: () => void;
};

type ProfileCardVars = CSSProperties & Record<`--${string}`, string>;

type TiltEngine = {
  setImmediate: (x: number, y: number) => void;
  setTarget: (x: number, y: number) => void;
  toCenter: () => void;
  beginInitial: (durationMs: number) => void;
  getCurrent: () => { x: number; y: number; tx: number; ty: number };
  cancel: () => void;
};

const clamp = (v: number, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v: number, precision = 3) => Number.parseFloat(v.toFixed(precision));
const adjust = (v: number, fMin: number, fMax: number, tMin: number, tMax: number) =>
  round(tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin));

function injectKeyframes() {
  const keyframesId = "pc-keyframes";
  if (typeof document === "undefined" || document.getElementById(keyframesId)) return;

  const style = document.createElement("style");
  style.id = keyframesId;
  style.textContent = `
    @keyframes pc-holo-bg {
      0% { background-position: 0 var(--background-y), 0 0, center; }
      100% { background-position: 0 var(--background-y), 90% 90%, center; }
    }
  `;
  document.head.appendChild(style);
}

function getOffsets(evt: PointerEvent, el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
}

function ProfileCardComponent({
  avatarUrl = "/icon-logo.png",
  iconUrl = "",
  grainUrl = "",
  innerGradient,
  behindGlowEnabled = true,
  behindGlowColor,
  behindGlowSize,
  className = "",
  enableTilt = true,
  enableMobileTilt = false,
  mobileTiltSensitivity = 5,
  miniAvatarUrl,
  name = "Javi A. Torres",
  title = "Software Engineer",
  handle = "javicodes",
  status = "Online",
  contactText = "Contact",
  showUserInfo = true,
  cardHeight = "320px",
  onContactClick,
}: ProfileCardProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const enterTimerRef = useRef<number | null>(null);
  const leaveRafRef = useRef<number | null>(null);

  useEffect(() => {
    injectKeyframes();
  }, []);

  const tiltEngine = useMemo<TiltEngine | null>(() => {
    if (!enableTilt) return null;

    let rafId: number | null = null;
    let running = false;
    let lastTs = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    const defaultTau = 0.14;
    const initialTau = 0.6;
    let initialUntil = 0;

    const setVarsFromXY = (x: number, y: number) => {
      const shell = shellRef.current;
      const wrap = wrapRef.current;
      if (!shell || !wrap) return;

      const width = shell.clientWidth || 1;
      const height = shell.clientHeight || 1;
      const percentX = clamp((100 / width) * x);
      const percentY = clamp((100 / height) * y);
      const centerX = percentX - 50;
      const centerY = percentY - 50;

      const properties: Record<string, string> = {
        "--pointer-x": `${percentX}%`,
        "--pointer-y": `${percentY}%`,
        "--background-x": `${adjust(percentX, 0, 100, 35, 65)}%`,
        "--background-y": `${adjust(percentY, 0, 100, 35, 65)}%`,
        "--pointer-from-center": `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        "--pointer-from-top": `${percentY / 100}`,
        "--pointer-from-left": `${percentX / 100}`,
        "--rotate-x": `${round(-(centerX / 5))}deg`,
        "--rotate-y": `${round(centerY / 4)}deg`,
        "--card-opacity": "1",
      };

      Object.entries(properties).forEach(([key, value]) => wrap.style.setProperty(key, value));
    };

    const step = (ts: number) => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;

      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      const tau = ts < initialUntil ? initialTau : defaultTau;
      const k = 1 - Math.exp(-dt / tau);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;
      setVarsFromXY(currentX, currentY);

      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;
      if (stillFar || document.hasFocus()) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };

    return {
      setImmediate(x: number, y: number) {
        currentX = x;
        currentY = y;
        setVarsFromXY(currentX, currentY);
      },
      setTarget(x: number, y: number) {
        targetX = x;
        targetY = y;
        start();
      },
      toCenter() {
        const shell = shellRef.current;
        if (!shell) return;
        this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
      beginInitial(durationMs: number) {
        initialUntil = performance.now() + durationMs;
        start();
      },
      getCurrent() {
        return { x: currentX, y: currentY, tx: targetX, ty: targetY };
      },
      cancel() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
        lastTs = 0;
      },
    };
  }, [enableTilt]);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;
      const { x, y } = getOffsets(event, shell);
      tiltEngine.setTarget(x, y);
    },
    [tiltEngine],
  );

  const handlePointerEnter = useCallback(
    (event: PointerEvent) => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;

      shell.classList.add("active");
      shell.classList.add("entering");
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = window.setTimeout(() => {
        shell.classList.remove("entering");
      }, ANIMATION_CONFIG.ENTER_TRANSITION_MS);

      const { x, y } = getOffsets(event, shell);
      tiltEngine.setTarget(x, y);
    },
    [tiltEngine],
  );

  const handlePointerLeave = useCallback(() => {
    const shell = shellRef.current;
    if (!shell || !tiltEngine) return;

    tiltEngine.toCenter();
    const checkSettle = () => {
      const { x, y, tx, ty } = tiltEngine.getCurrent();
      const settled = Math.hypot(tx - x, ty - y) < 0.6;
      if (settled) {
        shell.classList.remove("active");
        leaveRafRef.current = null;
      } else {
        leaveRafRef.current = requestAnimationFrame(checkSettle);
      }
    };

    if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
    leaveRafRef.current = requestAnimationFrame(checkSettle);
  }, [tiltEngine]);

  const handleDeviceOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      const shell = shellRef.current;
      if (!shell || !tiltEngine) return;

      const { beta, gamma } = event;
      if (beta == null || gamma == null) return;

      const centerX = shell.clientWidth / 2;
      const centerY = shell.clientHeight / 2;
      const x = clamp(centerX + gamma * mobileTiltSensitivity, 0, shell.clientWidth);
      const y = clamp(centerY + (beta - ANIMATION_CONFIG.DEVICE_BETA_OFFSET) * mobileTiltSensitivity, 0, shell.clientHeight);
      tiltEngine.setTarget(x, y);
    },
    [tiltEngine, mobileTiltSensitivity],
  );

  useEffect(() => {
    if (!enableTilt || !tiltEngine) return;

    const shell = shellRef.current;
    if (!shell) return;

    shell.addEventListener("pointerenter", handlePointerEnter);
    shell.addEventListener("pointermove", handlePointerMove);
    shell.addEventListener("pointerleave", handlePointerLeave);

    const handleClick = () => {
      if (!enableMobileTilt || location.protocol !== "https:") return;

      const motionEvent = window.DeviceMotionEvent as typeof DeviceMotionEvent & {
        requestPermission?: () => Promise<PermissionState>;
      };

      if (motionEvent?.requestPermission) {
        motionEvent
          .requestPermission()
          .then((state) => {
            if (state === "granted") window.addEventListener("deviceorientation", handleDeviceOrientation);
          })
          .catch(console.error);
      } else {
        window.addEventListener("deviceorientation", handleDeviceOrientation);
      }
    };

    shell.addEventListener("click", handleClick);
    const initialX = (shell.clientWidth || 0) - ANIMATION_CONFIG.INITIAL_X_OFFSET;
    const initialY = ANIMATION_CONFIG.INITIAL_Y_OFFSET;
    tiltEngine.setImmediate(initialX, initialY);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(ANIMATION_CONFIG.INITIAL_DURATION);

    return () => {
      shell.removeEventListener("pointerenter", handlePointerEnter);
      shell.removeEventListener("pointermove", handlePointerMove);
      shell.removeEventListener("pointerleave", handlePointerLeave);
      shell.removeEventListener("click", handleClick);
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
      if (enterTimerRef.current) window.clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
      shell.classList.remove("entering");
    };
  }, [
    enableTilt,
    enableMobileTilt,
    tiltEngine,
    handlePointerMove,
    handlePointerEnter,
    handlePointerLeave,
    handleDeviceOrientation,
  ]);

  const cardRadius = "30px";
  const cardStyle = useMemo<ProfileCardVars>(
    () => ({
      "--icon": iconUrl ? `url(${iconUrl})` : "none",
      "--grain": grainUrl ? `url(${grainUrl})` : "none",
      "--inner-gradient": innerGradient ?? DEFAULT_INNER_GRADIENT,
      "--behind-glow-color": behindGlowColor ?? "rgba(125, 190, 255, 0.67)",
      "--behind-glow-size": behindGlowSize ?? "50%",
      "--pointer-x": "50%",
      "--pointer-y": "50%",
      "--pointer-from-center": "0",
      "--pointer-from-top": "0.5",
      "--pointer-from-left": "0.5",
      "--card-opacity": "0",
      "--rotate-x": "0deg",
      "--rotate-y": "0deg",
      "--background-x": "50%",
      "--background-y": "50%",
      "--card-radius": cardRadius,
      "--sunpillar-1": "hsl(2, 100%, 73%)",
      "--sunpillar-2": "hsl(53, 100%, 69%)",
      "--sunpillar-3": "hsl(93, 100%, 69%)",
      "--sunpillar-4": "hsl(176, 100%, 76%)",
      "--sunpillar-5": "hsl(228, 100%, 74%)",
      "--sunpillar-6": "hsl(283, 100%, 73%)",
      "--sunpillar-clr-1": "var(--sunpillar-1)",
      "--sunpillar-clr-2": "var(--sunpillar-2)",
      "--sunpillar-clr-3": "var(--sunpillar-3)",
      "--sunpillar-clr-4": "var(--sunpillar-4)",
      "--sunpillar-clr-5": "var(--sunpillar-5)",
      "--sunpillar-clr-6": "var(--sunpillar-6)",
    }),
    [iconUrl, grainUrl, innerGradient, behindGlowColor, behindGlowSize],
  );

  const handleContactClick = useCallback(() => {
    onContactClick?.();
  }, [onContactClick]);

  const applyActiveTilt = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.style.transition = "none";
    event.currentTarget.style.transform = "translateZ(0) rotateX(var(--rotate-y)) rotateY(var(--rotate-x))";
  };

  const clearTilt = (event: ReactPointerEvent<HTMLElement>) => {
    const shell = shellRef.current;
    event.currentTarget.style.transition = shell?.classList.contains("entering")
      ? "transform 180ms ease-out"
      : "transform 1s ease";
    event.currentTarget.style.transform = "translateZ(0) rotateX(0deg) rotateY(0deg)";
  };

  const shineStyle: CSSProperties = {
    maskImage: "var(--icon)",
    maskMode: "luminance",
    maskRepeat: "repeat",
    maskSize: "150%",
    maskPosition: "top calc(200% - (var(--background-y) * 5)) left calc(100% - var(--background-x))",
    WebkitMaskImage: "var(--icon)",
    WebkitMaskRepeat: "repeat",
    WebkitMaskSize: "150%",
    WebkitMaskPosition: "top calc(200% - (var(--background-y) * 5)) left calc(100% - var(--background-x))",
    filter: "brightness(0.66) contrast(1.33) saturate(0.33) opacity(0.5)",
    animation: "pc-holo-bg 18s linear infinite",
    animationPlayState: "running",
    mixBlendMode: "color-dodge",
    transform: "translate3d(0, 0, 1px)",
    overflow: "hidden",
    zIndex: 3,
    background: `
      repeating-linear-gradient(
        0deg,
        var(--sunpillar-clr-1) 5%,
        var(--sunpillar-clr-2) 10%,
        var(--sunpillar-clr-3) 15%,
        var(--sunpillar-clr-4) 20%,
        var(--sunpillar-clr-5) 25%,
        var(--sunpillar-clr-6) 30%,
        var(--sunpillar-clr-1) 35%
      ),
      repeating-linear-gradient(
        -45deg,
        #0e152e 0%,
        hsl(180, 10%, 60%) 3.8%,
        hsl(180, 29%, 66%) 4.5%,
        hsl(180, 10%, 60%) 5.2%,
        #0e152e 10%,
        #0e152e 12%
      ),
      radial-gradient(
        farthest-corner circle at var(--pointer-x) var(--pointer-y),
        hsla(0, 0%, 0%, 0.1) 12%,
        hsla(0, 0%, 0%, 0.15) 20%,
        hsla(0, 0%, 0%, 0.25) 120%
      )
    `.replace(/\s+/g, " "),
    gridArea: "1 / -1",
    borderRadius: cardRadius,
    pointerEvents: "none",
  };

  const glareStyle: CSSProperties = {
    transform: "translate3d(0, 0, 1.1px)",
    overflow: "hidden",
    backgroundImage: `radial-gradient(
      farthest-corner circle at var(--pointer-x) var(--pointer-y),
      hsl(248, 25%, 80%) 12%,
      hsla(207, 40%, 30%, 0.8) 90%
    )`,
    mixBlendMode: "overlay",
    filter: "brightness(0.8) contrast(1.2)",
    zIndex: 4,
    gridArea: "1 / -1",
    borderRadius: cardRadius,
    pointerEvents: "none",
  };

  return (
    <div
      ref={wrapRef}
      className={`relative touch-none ${className}`.trim()}
      style={{ perspective: "500px", transform: "translate3d(0, 0, 0.1px)", ...cardStyle }}
    >
      {behindGlowEnabled ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-200 ease-out"
          style={{
            background:
              "radial-gradient(circle at var(--pointer-x) var(--pointer-y), var(--behind-glow-color) 0%, transparent var(--behind-glow-size))",
            filter: "blur(50px) saturate(1.1)",
            opacity: "calc(0.8 * var(--card-opacity))",
          }}
        />
      ) : null}
      <div ref={shellRef} className="group relative z-[1]">
        <section
          className="relative grid overflow-hidden"
          style={{
            height: "min(80svh, 540px)",
            maxHeight: cardHeight,
            minHeight: cardHeight,
            aspectRatio: "0.718",
            borderRadius: cardRadius,
            backgroundBlendMode: "color-dodge, normal, normal, normal",
            boxShadow:
              "rgba(0, 0, 0, 0.8) calc((var(--pointer-from-left) * 10px) - 3px) calc((var(--pointer-from-top) * 20px) - 6px) 20px -5px",
            transition: "transform 1s ease",
            transform: "translateZ(0) rotateX(0deg) rotateY(0deg)",
            background: "rgba(0, 0, 0, 0.9)",
          }}
          onPointerEnter={applyActiveTilt}
          onPointerLeave={clearTilt}
        >
          <div
            className="absolute inset-0 grid"
            style={{
              backgroundImage: "var(--inner-gradient)",
              backgroundColor: "rgba(0, 0, 0, 0.9)",
              borderRadius: cardRadius,
              gridArea: "1 / -1",
            }}
          >
            <div style={shineStyle} />
            <div style={glareStyle} />

            <div
              className="overflow-visible"
              style={{
                transform: "translateZ(2px)",
                gridArea: "1 / -1",
                borderRadius: cardRadius,
                pointerEvents: "none",
                zIndex: 5,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="absolute bottom-[-1px] left-1/2 w-full will-change-transform"
                src={avatarUrl}
                alt={`${name || "User"} avatar`}
                loading="lazy"
                style={{
                  transformOrigin: "50% 100%",
                  transform:
                    "translateX(calc(-50% + (var(--pointer-from-left) - 0.5) * 6px)) translateZ(0) scaleY(calc(1 + (var(--pointer-from-top) - 0.5) * 0.02)) scaleX(calc(1 + (var(--pointer-from-left) - 0.5) * 0.01))",
                  borderRadius: cardRadius,
                }}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              {showUserInfo ? (
                <div
                  className="pointer-events-auto absolute z-[2] flex items-center justify-between border border-white/10 backdrop-blur-[30px]"
                  style={{
                    bottom: "20px",
                    left: "20px",
                    right: "20px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "16px",
                    padding: "12px 14px",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="h-full w-full rounded-full object-cover"
                        src={miniAvatarUrl || avatarUrl}
                        alt={`${name || "User"} mini avatar`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.opacity = "0.5";
                          event.currentTarget.src = "/icon-logo.png";
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-start gap-1.5">
                      <div className="text-sm font-medium leading-none text-white/90">@{handle}</div>
                      <div className="text-sm leading-none text-white/70">{status}</div>
                    </div>
                  </div>
                  <button
                    className="cursor-pointer rounded-lg border border-white/10 px-4 py-3 text-xs font-semibold text-white/90 backdrop-blur-[10px] transition-all duration-200 ease-out hover:-translate-y-px hover:border-white/40"
                    onClick={handleContactClick}
                    type="button"
                    aria-label={`Contact ${name || "user"}`}
                  >
                    {contactText}
                  </button>
                </div>
              ) : null}
            </div>

            <div
              className="relative z-[6] max-h-full overflow-hidden text-center"
              style={{
                transform:
                  "translate3d(calc(var(--pointer-from-left) * -6px + 3px), calc(var(--pointer-from-top) * -6px + 3px), 0.1px)",
                gridArea: "1 / -1",
                borderRadius: cardRadius,
                pointerEvents: "none",
              }}
            >
              <div className="absolute top-8 flex w-full flex-col px-3">
                <h3
                  className="m-0 font-semibold"
                  style={{
                    fontSize: "clamp(1.2rem, 2.4vw, 2rem)",
                    backgroundImage: "linear-gradient(to bottom, #fff, #6f6fbe)",
                    backgroundSize: "1em 1.5em",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                  }}
                >
                  {name}
                </h3>
                <p
                  className="mx-auto w-min whitespace-nowrap font-semibold"
                  style={{
                    position: "relative",
                    top: "-6px",
                    fontSize: "13px",
                    margin: "0 auto",
                    backgroundImage: "linear-gradient(to bottom, #fff, #4a4ac0)",
                    backgroundSize: "1em 1.5em",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                  }}
                >
                  {title}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const ProfileCard = memo(ProfileCardComponent);
export default ProfileCard;
