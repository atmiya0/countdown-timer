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
  const [rounds, setRounds] = useState<number | undefined>(undefined);

  // Timer runtime state
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalTime, setTotalTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const BREAK_DURATION = 6;
  const [notifications, setNotifications] = useState<{ id: number; message: string; type: 'info' | 'success' }[]>([]);
  const notificationIdRef = useRef(0);

  const triggerNotification = (message: string, type: 'info' | 'success' = 'info') => {
    const id = notificationIdRef.current++;
    setNotifications(prev => {
      const next = [...prev, { id, message, type }];
      // Limit to 3 most recent to prevent overlap/clutter
      return next.slice(-3);
    });

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

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
    const currentRounds = rounds ?? 1;
    const total = currentMins * 60 + currentSecs;

    if (!hasStarted || timeLeft <= 0) {
      if (total <= 0) return;
      setTotalTime(total);
      setTimeLeft(total);
      setHasStarted(true);
      setCurrentRound(1); // Start from first round
      halfTimeTriggeredRef.current = false;
      completionTriggeredRef.current = false;
    }

    const remaining = (!hasStarted || timeLeft <= 0) ? total : timeLeft;
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
    setCurrentRound(1);
    setIsBreak(false);
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
        if (!isBreak) {
          if (currentRound < (rounds ?? 1)) {
            // Start Break & Increment Round
            triggerNotification(`Round ${currentRound} Complete!`, 'success');
            setIsBreak(true);
            setCurrentRound(prev => prev + 1);
            setTimeLeft(BREAK_DURATION);
            previousTimeLeftRef.current = BREAK_DURATION;
            endTimeRef.current = Date.now() + BREAK_DURATION * 1000;
            completionAudioRef.current?.play().catch(() => { });
          } else {
            // Final Completion
            endTimeRef.current = null;
            setIsRunning(false);
          }
        } else {
          // End Break, Start Work for the incremented round
          setIsBreak(false);
          setTimeLeft(totalTime);
          previousTimeLeftRef.current = totalTime;
          endTimeRef.current = Date.now() + totalTime * 1000;
          halfTimeTriggeredRef.current = false;
          completionTriggeredRef.current = false;
          triggerNotification(`Round ${currentRound} Start!`, 'info');
        }
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [isRunning, isBreak, currentRound, rounds, totalTime]);

  // Handle completion and checkpoints
  useEffect(() => {
    if (!hasStarted || isBreak) return;

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
      triggerNotification("Half Time!", 'info');
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
      if (currentRound >= (rounds ?? 1)) {
        triggerNotification("Completing Session...", 'info');
      }
    }

    // Zero reaching alert (Final round)
    if (timeLeft <= 0 && currentRound >= (rounds ?? 1)) {
      // Final completion - Confetti burst
      if (!confettiTriggeredRef.current) {
        confettiTriggeredRef.current = true;
        triggerConfetti();
        triggerNotification("Session Complete!", 'success');
      }

      if (!completionTriggeredRef.current) {
        completionTriggeredRef.current = true;
        completionAudioRef.current?.play().catch(() => { });
      }
    }

    previousTimeLeftRef.current = timeLeft;
  }, [timeLeft, hasStarted, totalTime, currentRound, rounds]);

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

  const handleRoundsChange = (value: string) => {
    if (value === "") {
      setRounds(undefined);
      return;
    }
    const num = parseInt(value);
    if (!isNaN(num)) {
      setRounds(Math.max(1, Math.min(99, num)));
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

        {/* Top Status Pill */}
        <div className="absolute top-[clamp(1rem,4vh,3rem)] left-1/2 -translate-x-1/2 z-[20]">
          <div className="status-section max-w-[90vw] whitespace-nowrap overflow-hidden">
            <div className={`status-dot shrink-0 ${!hasStarted ? "status-ready" :
              isRunning ? "status-running" :
                timeLeft === 0 ? "status-completed" :
                  "status-paused"
              }`} />
            <span className="status-text lowercase truncate">
              {!hasStarted ? "ready" :
                isBreak ? "next round starts in" :
                  isRunning ? "running" :
                    timeLeft === 0 ? "completed" :
                      "paused"}
            </span>
            <div className="status-separator shrink-0" />
            <span className="status-text truncate">
              round {currentRound} of {rounds ?? 1}
            </span>
          </div>
        </div>

        {/* Audio elements */}
        <audio ref={halfTimeAudioRef} src="/sounds/halftime-sound.mp3" preload="auto" />
        <audio ref={completionAudioRef} src="/sounds/completion-sound.mp3" preload="auto" />

        {/* Center UI: Timer Display */}
        <div className="flex flex-grow items-center justify-center z-10 w-full">
          <div className="timer-section -translate-y-16">
            <span className={`timer-display ${isBreak ? 'timer-break' : ''}`}>
              {hasStarted ? formatTime(timeLeft) : formatTime((minutes ?? (seconds === undefined ? 5 : 0)) * 60 + (seconds ?? 0))}
            </span>
          </div>
        </div>

        <div className="absolute bottom-[clamp(2rem,6vh,4rem)] left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 z-[20] w-full max-w-[min(95vw,1200px)]">
          {/* Time Input (only show when not started) */}
          {!hasStarted && (
            <div className="input-section flex-wrap md:flex-nowrap px-4 justify-center">
              <input
                type="number"
                value={minutes !== undefined ? minutes : ""}
                onChange={(e) => handleMinutesChange(e.target.value)}
                placeholder="MM"
                min="0"
                max="99"
                className="time-input w-[100px] sm:w-[140px] md:w-[180px]"
              />
              <span className="input-separator">:</span>
              <input
                type="number"
                value={seconds !== undefined ? seconds : ""}
                onChange={(e) => handleSecondsChange(e.target.value)}
                placeholder="SS"
                min="0"
                max="59"
                className="time-input w-[100px] sm:w-[140px] md:w-[180px]"
              />
              <span className="input-separator mx-1">/</span>
              <input
                type="number"
                value={rounds !== undefined ? rounds : ""}
                onChange={(e) => handleRoundsChange(e.target.value)}
                placeholder="rounds"
                min="1"
                max="99"
                className="time-input w-[140px] sm:w-[200px] md:w-[280px]"
              />
            </div>
          )}

          <div className="controls-section mt-2">
            {hasStarted && (
              <button onClick={resetTimer} className="btn btn-secondary btn-reset">
                Reset
              </button>
            )}

            {!isRunning ? (
              <button
                onClick={startTimer}
                disabled={!hasStarted && (minutes === undefined && seconds === undefined) === false && (minutes || 0) + (seconds || 0) === 0}
                className="btn btn-primary btn-action"
              >
                {hasStarted && timeLeft > 0 ? "Resume" : "Start"}
              </button>
            ) : (
              <button onClick={pauseTimer} className="btn btn-secondary btn-action">
                Pause
              </button>
            )}
          </div>

          {/* Info Text */}
          <p className="footer-info-text opacity-60">
            Alerts at half-time and on completion
          </p>
        </div>

        {/* Notifications Container */}
        <div className="notification-container">
          {notifications.map((n) => (
            <div key={n.id} className={`notification-toast type-${n.type}`}>
              <span className="notification-icon shrink-0">
                {n.type === 'success' ? '✨' : '⏰'}
              </span>
              <span className="flex-1 min-w-0 break-words line-clamp-2">
                {n.message}
              </span>
            </div>
          ))}
        </div>
      </main >
    </>
  );
}
