"use client";

import { useState, useEffect, useRef } from "react";
import useScreenSize from "@/hooks/use-screen-size";
import PixelTrail from "@/components/fancy/background/pixel-trail";
import { Ripple } from "@/components/ui/ripple";
import confetti from "canvas-confetti";

export default function Home() {
  const screenSize = useScreenSize();
  // Timer input state
  const [minutes, setMinutes] = useState<number | undefined>(undefined);
  const [seconds, setSeconds] = useState<number | undefined>(undefined);

  // Timer runtime state
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  // Audio refs
  const halfTimeAudioRef = useRef<HTMLAudioElement | null>(null);
  const completionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Timing refs
  const endTimeRef = useRef<number | null>(null);
  const previousTimeLeftRef = useRef<number>(0);
  const halfTimeTriggeredRef = useRef<boolean>(false);
  const completionTriggeredRef = useRef<boolean>(false);
  const confettiTriggeredRef = useRef<boolean>(false);

  // Format time for display
  const formatTime = (totalSeconds: number): string => {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Confetti trigger
  const triggerConfetti = () => {
    const defaults = {
      spread: 360,
      ticks: 200,
      gravity: 0,
      decay: 0.96,
      startVelocity: 30,
      colors: ["#FFE400", "#FFBD00", "#E89400", "#FFCA6C", "#FDFFB8"],
    };

    const shoot = () => {
      confetti({
        ...defaults,
        particleCount: 40,
        scalar: 1.2,
        shapes: ["star"],
      });

      confetti({
        ...defaults,
        particleCount: 10,
        scalar: 0.75,
        shapes: ["circle"],
      });
    };

    setTimeout(shoot, 0);
    setTimeout(shoot, 100);
    setTimeout(shoot, 200);
  };

  // Start timer
  const startTimer = () => {
    // Default to 5:00 if both are empty
    const currentMins = minutes ?? (seconds === undefined ? 5 : 0);
    const currentSecs = seconds ?? 0;
    const total = currentMins * 60 + currentSecs;

    if (!hasStarted || timeLeft <= 0) {
      if (total <= 0) return;
      setTotalTime(total);
      setTimeLeft(total);
      setHasStarted(true);
      halfTimeTriggeredRef.current = false;
      completionTriggeredRef.current = false;
    }

    const remaining = !hasStarted || timeLeft <= 0 ? total : timeLeft;
    if (remaining <= 0) return;
    endTimeRef.current = Date.now() + remaining * 1000;
    previousTimeLeftRef.current = remaining;
    setIsRunning(true);
  };

  // Pause timer
  const pauseTimer = () => {
    if (!isRunning) return;
    if (endTimeRef.current) {
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
    }
    endTimeRef.current = null;
    setIsRunning(false);
  };

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setHasStarted(false);
    setTimeLeft(0);
    setTotalTime(0);
    endTimeRef.current = null;
    previousTimeLeftRef.current = 0;
    halfTimeTriggeredRef.current = false;
    completionTriggeredRef.current = false;
    confettiTriggeredRef.current = false;

    // Stop any playing audio
    if (halfTimeAudioRef.current) {
      halfTimeAudioRef.current.pause();
      halfTimeAudioRef.current.currentTime = 0;
    }
    if (completionAudioRef.current) {
      completionAudioRef.current.pause();
      completionAudioRef.current.currentTime = 0;
    }
  };

  // Timer interval effect
  useEffect(() => {
    if (!isRunning || !endTimeRef.current) return;
    const tick = () => {
      if (!endTimeRef.current) return;
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setTimeLeft((prev) => (prev === remaining ? prev : remaining));
      if (remaining === 0) {
        endTimeRef.current = null;
        setIsRunning(false);
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Handle completion and checkpoints
  useEffect(() => {
    if (!hasStarted) return;

    if (totalTime <= 0) return;

    // Half time alert
    const halfTime = Math.floor(totalTime / 2);
    if (
      halfTime > 0 &&
      !halfTimeTriggeredRef.current &&
      previousTimeLeftRef.current > halfTime &&
      timeLeft <= halfTime
    ) {
      halfTimeTriggeredRef.current = true;
      halfTimeAudioRef.current?.play().catch(() => { });
    }

    // Completion sound alert (starts 4 seconds early)
    const COMPLETION_SOUND_LEAD_TIME = 4;
    if (
      !completionTriggeredRef.current &&
      previousTimeLeftRef.current > COMPLETION_SOUND_LEAD_TIME &&
      timeLeft <= COMPLETION_SOUND_LEAD_TIME
    ) {
      completionTriggeredRef.current = true;
      completionAudioRef.current?.play().catch(() => { });
    }

    // Zero reaching alert - Confetti burst
    if (timeLeft <= 0 && !confettiTriggeredRef.current) {
      confettiTriggeredRef.current = true;
      triggerConfetti();
    }

    // Zero reaching fallback for audio (in case lead time trigger was missed)
    if (timeLeft <= 0 && !completionTriggeredRef.current) {
      completionTriggeredRef.current = true;
      completionAudioRef.current?.play().catch(() => { });
    }

    previousTimeLeftRef.current = timeLeft;
  }, [timeLeft, hasStarted, totalTime]);

  // Handle input changes
  const handleMinutesChange = (value: string) => {
    if (value === "") {
      setMinutes(undefined);
      return;
    }
    const num = parseInt(value);
    if (!isNaN(num)) {
      setMinutes(Math.max(0, Math.min(99, num)));
    }
  };

  const handleSecondsChange = (value: string) => {
    if (value === "") {
      setSeconds(undefined);
      return;
    }
    const num = parseInt(value);
    if (!isNaN(num)) {
      setSeconds(Math.max(0, Math.min(59, num)));
    }
  };

  return (
    <>
      <main className="app-container">
        {/* SEO-friendly hidden heading */}
        <h1 className="sr-only">Professional Countdown Timer with Half-Time Alerts</h1>
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
          <Ripple mainCircleSize={800} numCircles={12} />
          <PixelTrail
            pixelSize={screenSize.lessThan("lg") ? 40 : 64}
            fadeDuration={800}
            pixelClassName="bg-[#ff5a00]/20"
            className="pointer-events-none"
          />
        </div>

        {/* Audio elements */}
        <audio ref={halfTimeAudioRef} src="/sounds/halftime-sound.mp3" preload="auto" />
        <audio ref={completionAudioRef} src="/sounds/completion-sound.mp3" preload="auto" />

        {/* Timer Display */}
        <div className="timer-section">
          <span className="timer-display">
            {hasStarted ? formatTime(timeLeft) : formatTime((minutes ?? (seconds === undefined ? 5 : 0)) * 60 + (seconds ?? 0))}
          </span>
        </div>

        {/* Footer with Divider and Three Columns */}
        <footer className="footer-section">
          <div className="footer-divider" />
          <div className="footer-content">
            {/* Left Column: Info */}
            <div className="footer-left">
              <p className="footer-info-text">
                Alerts at half-time and on completion
              </p>
            </div>

            {/* Middle Column: Status indicator */}
            <div className="footer-middle">
              <div className="status-section">
                <div className="status-indicator">
                  <div className={`status-dot ${!hasStarted ? "status-ready" :
                    isRunning ? "status-running" :
                      timeLeft === 0 ? "status-completed" :
                        "status-paused"
                    }`} />
                  <span className="status-text">
                    {!hasStarted ? "Ready" :
                      isRunning ? "Running" :
                        timeLeft === 0 ? "Completed" :
                          "Paused"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Inputs & Controls */}
            <div className="footer-right">
              {/* Time Input (only show when not started) */}
              {!hasStarted && (
                <div className="input-section">
                  <input
                    type="number"
                    value={minutes !== undefined ? minutes : ""}
                    onChange={(e) => handleMinutesChange(e.target.value)}
                    placeholder="MM"
                    min="0"
                    max="99"
                    className="time-input"
                  />
                  <span className="input-separator">:</span>
                  <input
                    type="number"
                    value={seconds !== undefined ? seconds : ""}
                    onChange={(e) => handleSecondsChange(e.target.value)}
                    placeholder="SS"
                    min="0"
                    max="59"
                    className="time-input"
                  />
                </div>
              )}

              {/* Controls */}
              <div className="controls-section">
                {!isRunning ? (
                  <button
                    onClick={startTimer}
                    disabled={!hasStarted && (minutes === undefined && seconds === undefined) === false && (minutes || 0) + (seconds || 0) === 0}
                    className="btn btn-primary"
                  >
                    {hasStarted && timeLeft > 0 ? "Resume" : "Start"}
                  </button>
                ) : (
                  <button onClick={pauseTimer} className="btn btn-secondary">
                    Pause
                  </button>
                )}

                {hasStarted && (
                  <button onClick={resetTimer} className="btn btn-secondary">
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
