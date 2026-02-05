"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  // Timer input state
  const [minutes, setMinutes] = useState<number>(5);
  const [seconds, setSeconds] = useState<number>(0);

  // Timer runtime state
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Audio refs
  const halfTimeAudioRef = useRef<HTMLAudioElement | null>(null);
  const completionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Timing refs
  const endTimeRef = useRef<number | null>(null);
  const previousTimeLeftRef = useRef<number>(0);
  const halfTimeTriggeredRef = useRef<boolean>(false);
  const completionTriggeredRef = useRef<boolean>(false);

  // Format time for display
  const formatTime = (totalSeconds: number): string => {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage
  const getProgress = (): number => {
    if (!hasStarted || totalTime <= 0) return 0;
    const elapsed = totalTime - timeLeft;
    const progress = (elapsed / totalTime) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  // Start timer
  const startTimer = () => {
    const total = minutes * 60 + seconds;
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
    setIsResetting(true);
    setIsRunning(false);
    setHasStarted(false);
    setTimeLeft(0);
    setTotalTime(0);
    endTimeRef.current = null;
    previousTimeLeftRef.current = 0;
    halfTimeTriggeredRef.current = false;
    completionTriggeredRef.current = false;

    // Stop any playing audio
    if (halfTimeAudioRef.current) {
      halfTimeAudioRef.current.pause();
      halfTimeAudioRef.current.currentTime = 0;
    }
    if (completionAudioRef.current) {
      completionAudioRef.current.pause();
      completionAudioRef.current.currentTime = 0;
    }

    // Reset the "resetting" state after the animation completes
    setTimeout(() => {
      setIsResetting(false);
    }, 2000);
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

    // Completion sound alert (starts 3 seconds early)
    const COMPLETION_SOUND_LEAD_TIME = 3;
    if (
      !completionTriggeredRef.current &&
      previousTimeLeftRef.current > COMPLETION_SOUND_LEAD_TIME &&
      timeLeft <= COMPLETION_SOUND_LEAD_TIME
    ) {
      completionTriggeredRef.current = true;
      completionAudioRef.current?.play().catch(() => { });
    }

    // Zero reaching fallback (in case timer is very short)
    if (timeLeft === 0 && !completionTriggeredRef.current) {
      completionTriggeredRef.current = true;
      completionAudioRef.current?.play().catch(() => { });
    }

    previousTimeLeftRef.current = timeLeft;
  }, [timeLeft, hasStarted, totalTime]);

  // Handle input changes
  const handleMinutesChange = (value: string) => {
    const num = parseInt(value) || 0;
    setMinutes(Math.max(0, Math.min(99, num)));
  };

  const handleSecondsChange = (value: string) => {
    const num = parseInt(value) || 0;
    setSeconds(Math.max(0, Math.min(59, num)));
  };

  return (
    <>
      <div
        className="progress-bar-background"
        style={{
          width: `${getProgress()}%`,
          transition: isResetting ? "width 2s ease-in-out" : "width 1s linear"
        }}
      />
      <main className="app-container">

        {/* Audio elements */}
        <audio ref={halfTimeAudioRef} src="/sounds/halftime-sound.mp3" preload="auto" />
        <audio ref={completionAudioRef} src="/sounds/completion-sound.mp3" preload="auto" />

        {/* Timer Display */}
        <div className="timer-section">
          <span className="timer-display">
            {hasStarted ? formatTime(timeLeft) : formatTime(minutes * 60 + seconds)}
          </span>
        </div>

        {/* Time Input (only show when not started) */}
        {!hasStarted && (
          <div className="input-section">
            <div className="input-group">
              <label className="input-label">Minutes</label>
              <input
                type="number"
                value={minutes}
                onChange={(e) => handleMinutesChange(e.target.value)}
                min="0"
                max="99"
                className="time-input"
              />
            </div>
            <span className="input-separator">:</span>
            <div className="input-group">
              <label className="input-label">Seconds</label>
              <input
                type="number"
                value={seconds}
                onChange={(e) => handleSecondsChange(e.target.value)}
                min="0"
                max="59"
                className="time-input"
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="controls-section">
          {!isRunning ? (
            <button
              onClick={startTimer}
              disabled={!hasStarted && minutes === 0 && seconds === 0}
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

        {/* Status indicator */}
        {hasStarted && (
          <div className="status-section">
            <div className="status-indicator">
              <div className={`status-dot ${isRunning ? "status-running" : timeLeft === 0 ? "status-completed" : "status-paused"}`} />
              <span className="status-text">
                {timeLeft === 0 ? "Completed" : isRunning ? "Running" : "Paused"}
              </span>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="info-section">
          <p>Alerts at half-time and on completion</p>
        </div>
      </main>
    </>
  );
}
