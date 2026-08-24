import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "reaction-best-react";

const STAGE_TEXT = {
  idle: "タップして開始",
  waiting: "待って…",
  go: "今だ!",
  early: "早い!もう一度",
};

export default function App() {
  const [state, setState] = useState("idle");
  const [last, setLast] = useState(null);
  const [best, setBest] = useState(() => {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return stored || null;
  });

  const timeoutRef = useRef(null);
  const goAtRef = useRef(0);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  function startRound() {
    setState("waiting");
    const delay = 1000 + Math.random() * 2500;
    timeoutRef.current = setTimeout(() => {
      goAtRef.current = performance.now();
      setState("go");
    }, delay);
  }

  function handleClick() {
    if (state === "idle" || state === "early" || state === "result") {
      startRound();
      return;
    }
    if (state === "waiting") {
      clearTimeout(timeoutRef.current);
      setState("early");
      return;
    }
    if (state === "go") {
      const elapsed = Math.round(performance.now() - goAtRef.current);
      setLast(elapsed);
      setBest((prev) => {
        if (!prev || elapsed < prev) {
          localStorage.setItem(STORAGE_KEY, String(elapsed));
          return elapsed;
        }
        return prev;
      });
      setState("result");
    }
  }

  const stageText = state === "result" ? `${last}ms · もう一度タップ` : STAGE_TEXT[state];
  const stageClass = state === "go" ? "go" : state === "early" ? "early" : "";

  return (
    <div className="page">
      <a className="back" href="../">← LAB</a>
      <span className="badge">⚛️ Vite + React 版</span>
      <h1>⚡ 反応速度テスト</h1>
      <p className="lead">色が変わった瞬間にタップ。フライングは無効。</p>
      <div id="stage" className={stageClass} onClick={handleClick}>
        {stageText}
      </div>
      <div id="stats">
        <div>
          <span>{last ?? "–"}</span>
          <small>今回 (ms)</small>
        </div>
        <div>
          <span>{best ?? "–"}</span>
          <small>ベスト (ms)</small>
        </div>
      </div>
      <a className="compare" href="../reaction/">素のJS版と見比べる →</a>
    </div>
  );
}
