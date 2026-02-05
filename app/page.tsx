"use client";

import { useState, useEffect, useRef } from "react";

export default function Home() {
  // Timer state
  const [minutes, setMinutes] = useState<number>(5);
  const [seconds, setSeconds] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Audio refs
  const halfTimeAudioRef = useRef<HTMLAudioElement | null>(null);
  const completionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Timer refs
  const [totalTime, setTotalTime] = useState<number>(0);
  const totalTimeRef = useRef<number>(0);
  const halfTimeTriggeredRef = useRef<boolean>(false);
  const completionTriggeredRef = useRef<boolean>(false);

  // Completion sound length (starts 4 seconds before end)
  const COMPLETION_SOUND_LEAD_TIME = 4;

  // Format time for display
  const formatTime = (totalSeconds: number): string => {
    const safeSeconds = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress percentage (elapsed time - width increases as timer runs)
  const getProgress = (): number => {
    if (!hasStarted || totalTime <= 0) return 0;
    const elapsed = totalTime - timeLeft;
    const progress = (elapsed / totalTime) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  // Start timer
  const startTimer = () => {
    console.log("startTimer called", { hasStarted, timeLeft, minutes, seconds });
    if (!hasStarted || timeLeft <= 0) {
      const total = minutes * 60 + seconds;
      console.log("Initializing timer with total:", total);
      if (total <= 0) return;
      setTotalTime(total);
      totalTimeRef.current = total;
      setTimeLeft(total);
      setHasStarted(true);
      halfTimeTriggeredRef.current = false;
      completionTriggeredRef.current = false;
    }
    console.log("Setting isRunning to true");
    setIsRunning(true);
  };

  // Pause timer
  const pauseTimer = () => {
    setIsRunning(false);
  };

  // Reset timer
  const resetTimer = () => {
    setIsResetting(true);
    setIsRunning(false);
    setHasStarted(false);
    setTimeLeft(0);
    setTotalTime(0);
    totalTimeRef.current = 0;
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

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      console.log("Starting interval");
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            console.log("Timer hit zero in interval");
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        console.log("Clearing interval");
        clearInterval(interval);
      }
    };
  }, [isRunning]);

  // Handle checkpoint triggers (audio) without stopping logic
  useEffect(() => {
    if (!isRunning || !hasStarted) return;

    // Check for other triggers
    const currentTotal = totalTimeRef.current;
    if (currentTotal > 0) {
      // Check for half time
      const halfTime = Math.floor(currentTotal / 2);
      if (timeLeft === halfTime && !halfTimeTriggeredRef.current && halfTime > 0 && currentTotal > 1) {
        halfTimeTriggeredRef.current = true;
        halfTimeAudioRef.current?.play().catch((err) => console.error("Audio error:", err));
      }

      // Check for completion sound (starts before end)
      if (timeLeft === COMPLETION_SOUND_LEAD_TIME && !completionTriggeredRef.current && currentTotal > COMPLETION_SOUND_LEAD_TIME) {
        completionTriggeredRef.current = true;
        completionAudioRef.current?.play().catch((err) => console.error("Audio error:", err));
      }

      // Final completion audio (at 0)
      if (timeLeft === 0 && !completionTriggeredRef.current) {
        completionTriggeredRef.current = true;
        completionAudioRef.current?.play().catch((err) => console.error("Audio error:", err));
      }
    }
  }, [timeLeft, isRunning, hasStarted]);

  // Handle minutes/seconds changes
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
      {/* Background Progress Bar - Full Height, Dynamic Width */}
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
            <button
              onClick={pauseTimer}
              className="btn btn-secondary"
            >
              Pause
            </button>
          )}

          {hasStarted && (
            <button
              onClick={resetTimer}
              className="btn btn-secondary"
            >
              Reset
            </button>
          )}
        </div>

        {/* Status indicator */}
        {hasStarted && (
          <div className="status-section">
            <div className="status-indicator">
              <div
                className={`status-dot ${isRunning ? "status-running" : timeLeft === 0 ? "status-completed" : "status-paused"}`}
              />
              <span className="status-text">
                {timeLeft === 0
                  ? "Completed"
                  : isRunning
                    ? "Running"
                    : "Paused"}
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
