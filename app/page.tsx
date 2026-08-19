"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type Screen = "home" | "speed" | "playing" | "gameover";
type Speed = "light" | "medium" | "fast";
type Lane = 0 | 1 | 2;

type Obstacle = {
  id: number;
  row: number;
  lane: Lane;
  y: number;
  color: string;
  kind: "car" | "van";
};

const SPEEDS: Record<Speed, {
  label: string;
  hint: string;
  icon: string;
  travel: number;
  spawn: number;
  doubleChance: number;
}> = {
  light: { label: "خفيف", hint: "للبداية الهادئة", icon: "🐢", travel: 25, spawn: 1.7, doubleChance: 0.2 },
  medium: { label: "متوسط", hint: "مرح وتحدٍ متوازن", icon: "🚙", travel: 32, spawn: 1.42, doubleChance: 0.34 },
  fast: { label: "سريع", hint: "للسائق الشجاع", icon: "⚡", travel: 39, spawn: 1.2, doubleChance: 0.46 },
};

const CAR_COLORS = ["#ef5f62", "#4e9eea", "#8a66db", "#44b87a", "#ff8b42"];
const BEST_SCORE_KEY = "rivan-adventure-best";

function Vehicle({
  color,
  player = false,
  kind = "car",
  className = "",
}: {
  color: string;
  player?: boolean;
  kind?: "car" | "van";
  className?: string;
}) {
  return (
    <div
      className={`vehicle-body ${player ? "rivan-car" : "traffic-car"} ${kind} ${className}`}
      style={{ "--car-color": color } as CSSProperties}
      aria-hidden="true"
    >
      {player && <span className="car-star">★</span>}
      <span className="car-window" />
      <span className="car-bumper" />
      <span className="car-light light-a" />
      <span className="car-light light-b" />
      <span className="car-wheel wheel-a" />
      <span className="car-wheel wheel-b" />
    </div>
  );
}

function Cloud({ className }: { className: string }) {
  return <span className={`cloud ${className}`} aria-hidden="true" />;
}

function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <section className="screen home-screen" aria-labelledby="game-title">
      <Cloud className="cloud-one" />
      <Cloud className="cloud-two" />
      <div className="sun" aria-hidden="true" />
      <div className="eyebrow">رحلة مرِحة على الطريق</div>
      <h1 id="game-title">مغامرة <span>ريفان</span></h1>
      <p className="home-lead">تفادَ السيارات واجمع أكبر عدد من النقاط!</p>
      <div className="home-scene" aria-hidden="true">
        <span className="tree tree-a">♣</span>
        <span className="tree tree-b">♣</span>
        <div className="preview-road">
          <span className="preview-line line-a" />
          <span className="preview-line line-b" />
          <Vehicle color="#ffc12e" player className="preview-car" />
        </div>
      </div>
      <button className="button primary-button" type="button" onClick={onStart}>
        <span>ابدأ</span><b aria-hidden="true">←</b>
      </button>
      <small className="home-tip">استخدم الأزرار لتحريك سيارة ريفان</small>
    </section>
  );
}

function SpeedScreen({
  selected,
  onSelect,
  onPlay,
  onBack,
}: {
  selected: Speed;
  onSelect: (speed: Speed) => void;
  onPlay: () => void;
  onBack: () => void;
}) {
  return (
    <section className="screen speed-screen" aria-labelledby="speed-title">
      <Cloud className="speed-cloud" />
      <button className="round-button back-button" type="button" onClick={onBack} aria-label="العودة إلى القائمة">↩</button>
      <div className="speed-flag" aria-hidden="true">🏁</div>
      <h2 id="speed-title">اختر السرعة</h2>
      <p>يمكنك اختيار المستوى المناسب لك</p>
      <div className="speed-list" role="radiogroup" aria-label="سرعة اللعبة">
        {(Object.keys(SPEEDS) as Speed[]).map((speed) => {
          const option = SPEEDS[speed];
          const isSelected = selected === speed;
          return (
            <button
              className={`speed-option speed-${speed}`}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-selected={isSelected}
              key={speed}
              onClick={() => onSelect(speed)}
            >
              <span className="speed-icon" aria-hidden="true">{option.icon}</span>
              <span className="speed-copy"><strong>{option.label}</strong><small>{option.hint}</small></span>
              <span className="speed-check" aria-hidden="true">✓</span>
            </button>
          );
        })}
      </div>
      <button className="button primary-button play-button" type="button" onClick={onPlay}>
        ابدأ اللعب <span aria-hidden="true">🚗</span>
      </button>
    </section>
  );
}

function ScorePill({ score, best }: { score: number; best: number }) {
  return (
    <div className="score-pill">
      <strong>النقاط: <span data-testid="score">{score}</span></strong>
      <small>أفضل نتيجة: {best}</small>
    </div>
  );
}

function GameRoad({
  roadRef,
  lane,
  obstacles,
  crashed,
}: {
  roadRef: React.RefObject<HTMLDivElement | null>;
  lane: Lane;
  obstacles: Obstacle[];
  crashed: boolean;
}) {
  return (
    <div className={`game-board ${crashed ? "is-crashed" : ""}`} data-testid="game-board">
      <div className="grass-pattern grass-left" aria-hidden="true"><i /><i /><i /></div>
      <div className="grass-pattern grass-right" aria-hidden="true"><i /><i /><i /></div>
      <div className="road" ref={roadRef} data-testid="three-lane-road">
        <span className="curb curb-left" />
        <span className="curb curb-right" />
        <span className="lane-divider divider-one" />
        <span className="lane-divider divider-two" />
        {obstacles.map((obstacle) => (
          <div
            className="road-vehicle obstacle"
            data-lane={obstacle.lane}
            data-row={obstacle.row}
            key={obstacle.id}
            style={{ left: `${(obstacle.lane + 0.5) * 33.333}%`, top: `${obstacle.y}%` }}
          >
            <Vehicle color={obstacle.color} kind={obstacle.kind} />
          </div>
        ))}
        <div
          className="road-vehicle player-vehicle"
          data-lane={lane}
          data-testid="player-car"
          style={{ left: `${(lane + 0.5) * 33.333}%` }}
        >
          <Vehicle color="#ffc12e" player />
        </div>
      </div>
    </div>
  );
}

function Controls({ onMove, disabled }: { onMove: (direction: -1 | 1) => void; disabled: boolean }) {
  const handleKey = (direction: -1 | 1) => (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onMove(direction);
    }
  };

  return (
    <div className="controls" dir="ltr" aria-label="أزرار تحريك السيارة">
      <button
        type="button"
        className="control-button control-left"
        aria-label="تحريك السيارة إلى اليسار"
        disabled={disabled}
        onPointerDown={(event) => { event.preventDefault(); onMove(-1); }}
        onKeyDown={handleKey(-1)}
      >
        <span aria-hidden="true">‹</span><strong>يسار</strong>
      </button>
      <button
        type="button"
        className="control-button control-right"
        aria-label="تحريك السيارة إلى اليمين"
        disabled={disabled}
        onPointerDown={(event) => { event.preventDefault(); onMove(1); }}
        onKeyDown={handleKey(1)}
      >
        <strong>يمين</strong><span aria-hidden="true">›</span>
      </button>
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedSpeed, setSelectedSpeed] = useState<Speed>("medium");
  const [lane, setLane] = useState<Lane>(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [muted, setMuted] = useState(false);
  const [crashed, setCrashed] = useState(false);

  const roadRef = useRef<HTMLDivElement>(null);
  const laneRef = useRef<Lane>(1);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const scoreRef = useRef(0);
  const mutedRef = useRef(false);
  const crashedRef = useRef(false);
  const frameRef = useRef(0);
  const nextIdRef = useRef(1);
  const nextRowRef = useRef(1);
  const spawnRef = useRef(0.8);
  const passedRowsRef = useRef(new Set<number>());
  const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<{
    context: AudioContext;
    engine: OscillatorNode | null;
    engineGain: GainNode | null;
  } | null>(null);

  useEffect(() => {
    const stored = Number.parseInt(window.localStorage.getItem(BEST_SCORE_KEY) ?? "0", 10);
    const bestFrame = Number.isFinite(stored) && stored > 0
      ? window.requestAnimationFrame(() => setBest(stored))
      : 0;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => window.cancelAnimationFrame(bestFrame);
  }, []);

  const ensureAudio = useCallback(async () => {
    if (!audioRef.current) {
      const AudioConstructor = window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioConstructor) return null;
      audioRef.current = { context: new AudioConstructor(), engine: null, engineGain: null };
    }
    if (audioRef.current.context.state === "suspended") {
      await audioRef.current.context.resume();
    }
    return audioRef.current;
  }, []);

  const stopEngine = useCallback(() => {
    const audio = audioRef.current;
    if (!audio?.engine) return;
    try { audio.engine.stop(); } catch { /* already stopped */ }
    audio.engine.disconnect();
    audio.engineGain?.disconnect();
    audio.engine = null;
    audio.engineGain = null;
  }, []);

  const startEngine = useCallback(async () => {
    if (mutedRef.current) return;
    const audio = await ensureAudio();
    if (!audio || audio.engine) return;
    const oscillator = audio.context.createOscillator();
    const gain = audio.context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.value = 72;
    gain.gain.value = 0.018;
    oscillator.connect(gain).connect(audio.context.destination);
    oscillator.start();
    audio.engine = oscillator;
    audio.engineGain = gain;
  }, [ensureAudio]);

  const playTone = useCallback((frequency: number, duration = 0.09, volume = 0.055, type: OscillatorType = "sine") => {
    if (mutedRef.current) return;
    const audio = audioRef.current;
    if (!audio || audio.context.state !== "running") return;
    const oscillator = audio.context.createOscillator();
    const gain = audio.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audio.context.currentTime);
    gain.gain.setValueAtTime(volume, audio.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.context.currentTime + duration);
    oscillator.connect(gain).connect(audio.context.destination);
    oscillator.start();
    oscillator.stop(audio.context.currentTime + duration);
  }, []);

  const playCrash = useCallback(() => {
    if (mutedRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    const oscillator = audio.context.createOscillator();
    const gain = audio.context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(180, audio.context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(55, audio.context.currentTime + 0.36);
    gain.gain.setValueAtTime(0.13, audio.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.context.currentTime + 0.38);
    oscillator.connect(gain).connect(audio.context.destination);
    oscillator.start();
    oscillator.stop(audio.context.currentTime + 0.4);
  }, []);

  const finishGame = useCallback((finalScore: number) => {
    if (crashedRef.current) return;
    crashedRef.current = true;
    setCrashed(true);
    stopEngine();
    playCrash();
    const rounded = Math.floor(finalScore);
    const nextBest = Math.max(best, rounded);
    if (nextBest > best) {
      setBest(nextBest);
      window.localStorage.setItem(BEST_SCORE_KEY, String(nextBest));
    }
    gameOverTimerRef.current = setTimeout(() => {
      setScore(rounded);
      setScreen("gameover");
    }, 480);
  }, [best, playCrash, stopEngine]);

  const startGame = useCallback(async () => {
    if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
    laneRef.current = 1;
    obstaclesRef.current = [];
    scoreRef.current = 0;
    spawnRef.current = 0.75;
    passedRowsRef.current.clear();
    crashedRef.current = false;
    setLane(1);
    setObstacles([]);
    setScore(0);
    setCrashed(false);
    setScreen("playing");
    await ensureAudio();
    playTone(420, 0.1, 0.06);
    await startEngine();
  }, [ensureAudio, playTone, startEngine]);

  const move = useCallback((direction: -1 | 1) => {
    if (screen !== "playing" || crashedRef.current) return;
    const target = Math.max(0, Math.min(2, laneRef.current + direction)) as Lane;
    if (target === laneRef.current) {
      playTone(150, 0.055, 0.025);
      return;
    }
    laneRef.current = target;
    setLane(target);
    playTone(direction > 0 ? 360 : 310, 0.07, 0.04);
  }, [playTone, screen]);

  useEffect(() => {
    if (screen !== "playing") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(event.key === "ArrowLeft" ? -1 : 1);
      }
    };
    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move, screen]);

  useEffect(() => {
    if (screen !== "playing") return;
    const config = SPEEDS[selectedSpeed];
    let lastTime = performance.now();
    let roadShift = 0;

    const frame = (now: number) => {
      if (crashedRef.current) return;
      const delta = Math.min((now - lastTime) / 1000, 0.04);
      lastTime = now;
      roadShift = (roadShift + delta * config.travel * 7) % 88;
      roadRef.current?.style.setProperty("--road-shift", `${roadShift}px`);

      scoreRef.current += delta * 10;
      spawnRef.current -= delta;
      let nextObstacles = obstaclesRef.current.map((obstacle) => ({
        ...obstacle,
        y: obstacle.y + config.travel * delta,
      }));

      if (spawnRef.current <= 0) {
        const lanes: Lane[] = [0, 1, 2];
        for (let index = lanes.length - 1; index > 0; index -= 1) {
          const randomIndex = Math.floor(Math.random() * (index + 1));
          [lanes[index], lanes[randomIndex]] = [lanes[randomIndex], lanes[index]];
        }
        const count = Math.random() < config.doubleChance ? 2 : 1;
        const row = nextRowRef.current++;
        const additions = lanes.slice(0, count).map((obstacleLane, index): Obstacle => ({
          id: nextIdRef.current++,
          row,
          lane: obstacleLane,
          y: -18 - index * 0.8,
          color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
          kind: Math.random() < 0.22 ? "van" : "car",
        }));
        nextObstacles = [...nextObstacles, ...additions];
        spawnRef.current = config.spawn * (0.9 + Math.random() * 0.22);
      }

      for (const obstacle of nextObstacles) {
        if (obstacle.lane === laneRef.current && obstacle.y > 70 && obstacle.y < 87) {
          obstaclesRef.current = nextObstacles;
          setObstacles(nextObstacles);
          finishGame(scoreRef.current);
          return;
        }
        if (obstacle.y > 92 && !passedRowsRef.current.has(obstacle.row)) {
          passedRowsRef.current.add(obstacle.row);
          scoreRef.current += 8;
          playTone(610, 0.06, 0.025);
        }
      }

      nextObstacles = nextObstacles.filter((obstacle) => obstacle.y < 119);
      obstaclesRef.current = nextObstacles;
      setObstacles(nextObstacles);
      setScore(Math.floor(scoreRef.current));
      frameRef.current = requestAnimationFrame(frame);
    };

    frameRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(frameRef.current);
  }, [finishGame, playTone, screen, selectedSpeed]);

  useEffect(() => () => {
    cancelAnimationFrame(frameRef.current);
    if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
    stopEngine();
    audioRef.current?.context.close().catch(() => undefined);
  }, [stopEngine]);

  const toggleSound = async () => {
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    setMuted(nextMuted);
    if (nextMuted) {
      stopEngine();
    } else if (screen === "playing" && !crashedRef.current) {
      await ensureAudio();
      playTone(520, 0.08, 0.05);
      await startEngine();
    }
  };

  const goHome = () => {
    stopEngine();
    crashedRef.current = false;
    setCrashed(false);
    setScreen("home");
  };

  return (
    <main className={`game-shell screen-${screen}`} dir="rtl">
      {screen === "home" && <HomeScreen onStart={() => setScreen("speed")} />}
      {screen === "speed" && (
        <SpeedScreen
          selected={selectedSpeed}
          onSelect={setSelectedSpeed}
          onPlay={startGame}
          onBack={() => setScreen("home")}
        />
      )}
      {screen === "playing" && (
        <section className="screen play-screen" aria-label="طريق مغامرة ريفان">
          <header className="game-hud">
            <button className="round-button sound-button" type="button" onClick={toggleSound} aria-label={muted ? "تشغيل الصوت" : "كتم الصوت"}>
              {muted ? "🔇" : "🔊"}
            </button>
            <ScorePill score={score} best={best} />
            <span className="level-pill">{SPEEDS[selectedSpeed].label}</span>
          </header>
          <GameRoad roadRef={roadRef} lane={lane} obstacles={obstacles} crashed={crashed} />
          <Controls onMove={move} disabled={crashed} />
        </section>
      )}
      {screen === "gameover" && (
        <section className="screen gameover-screen" aria-labelledby="crash-title">
          <Cloud className="gameover-cloud" />
          <div className="crash-bubble" aria-hidden="true">💥</div>
          <h2 id="crash-title">اصطدمت السيارة!</h2>
          <p>حاول مرة أخرى</p>
          <div className="final-score-card">
            <span>النقاط</span><strong>{score}</strong>
            <small>أفضل نتيجة: {best}</small>
          </div>
          <button className="button primary-button" type="button" onClick={startGame}>إعادة اللعب <span aria-hidden="true">↻</span></button>
          <button className="button secondary-button" type="button" onClick={goHome}>القائمة الرئيسية</button>
        </section>
      )}
    </main>
  );
}
