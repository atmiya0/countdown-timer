"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export default function Home() {
  // Timer state
  const [minutes, setMinutes] = useState<number>(5);
  const [seconds, setSeconds] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [halfTimeTriggered, setHalfTimeTriggered] = useState<boolean>(false);
  const [completionTriggered, setCompletionTriggered] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Audio refs
  const halfTimeAudioRef = useRef<HTMLAudioElement | null>(null);
  const completionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Timer refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimeRef = useRef<number>(0);

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
    if (!hasStarted || totalTimeRef.current <= 0) return 0;
    const elapsed = totalTimeRef.current - timeLeft;
    const progress = (elapsed / totalTimeRef.current) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  // Start timer
  const startTimer = useCallback(() => {
    if (!hasStarted) {
      const total = minutes * 60 + seconds;
      if (total <= 0) return;
      totalTimeRef.current = total;
      setTimeLeft(total);
      setHasStarted(true);
      setHalfTimeTriggered(false);
      setCompletionTriggered(false);
    }
    setIsRunning(true);
  }, [hasStarted, minutes, seconds]);

  // Pause timer
  const pauseTimer = () => {
    setIsRunning(false);
  };

  // Reset timer
  const resetTimer = () => {
    setIsResetting(true);
    setIsRunning(false);
    setHasStarted(false);
    setHalfTimeTriggered(false);
    setCompletionTriggered(false);
    setTimeLeft(0);
    totalTimeRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
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
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = Math.max(0, prev - 1);

          // Check for half time (only if total time > 1 second)
          const halfTime = Math.floor(totalTimeRef.current / 2);
          if (newTime === halfTime && !halfTimeTriggered && halfTime > 0 && totalTimeRef.current > 1) {
            setHalfTimeTriggered(true);
            halfTimeAudioRef.current?.play().catch(() => { });
          }

          // Check for completion sound (8 seconds before end, or skip if timer too short)
          if (newTime === COMPLETION_SOUND_LEAD_TIME && !completionTriggered && totalTimeRef.current > COMPLETION_SOUND_LEAD_TIME) {
            setCompletionTriggered(true);
            completionAudioRef.current?.play().catch(() => { });
          }

          // Stop timer at 0
          if (newTime <= 0) {
            setIsRunning(false);
            // If timer was shorter than 8 seconds, play completion sound now
            if (!completionTriggered) {
              setCompletionTriggered(true);
              completionAudioRef.current?.play().catch(() => { });
            }
            return 0;
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, halfTimeTriggered, completionTriggered, timeLeft]);

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
              {hasStarted ? "Resume" : "Start"}
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
