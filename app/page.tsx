"use client";
import { useEffect, useState, useMemo, useRef } from "react";

// スコア型の定義
type Score = {
  score: number;
  userName: string;
};

export default function Home() {
  // 問題リスト（useMemoでメモ化）
  const questions = useMemo(
    () => [
      { question: "React", image: "./monster1.jpg" },
      { question: "Next.js", image: "./monster2.jpg" },
      { question: "Tailwind CSS", image: "./monster3.jpg" },
      { question: "TypeScript", image: "./monster4.jpg" },
      { question: "JavaScript", image: "./monster5.jpg" },
    ],
    []
  );

  // 各種ステート
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // 現在の問題番号
  const [currentPosition, setCurrentPosition] = useState(0); // 現在の文字位置
  const [isCompleted, setIsCompleted] = useState(false); // ゲーム終了フラグ
  const [isStarted, setIsStarted] = useState(false); // ゲーム開始フラグ
  const [userName, setUserName] = useState(""); // ユーザー名
  const [startTime, setStartTime] = useState<number>(0); // 開始時刻
  const [totalTime, setTotalTime] = useState<number>(0); // 合計時間
  const [score, setScore] = useState<number>(0); // スコア
  const [scores, setScores] = useState<Score[]>([]); // ランキング

  // 音声ファイルの参照
  const bgmRef = useRef<HTMLAudioElement>(null);
  const shotSoundRef = useRef<HTMLAudioElement>(null);

  // 音声ファイルの初期化
  useEffect(() => {
    bgmRef.current = new Audio("./bgm.mp3");
    bgmRef.current.loop = true;
    shotSoundRef.current = new Audio("./shot.mp3");
  }, []);

  // BGMの再生・停止制御
  useEffect(() => {
    if (isStarted && bgmRef.current) {
      bgmRef.current.play().catch((error) => {
        console.error("BGM playback failed:", error);
      });
    }
    if (isCompleted && bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
  }, [isStarted, isCompleted]);

  // 結果をサーバーに送信し、スコアを計算
  const addResult = async (userName: string, startTime: number) => {
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const timeInSeconds = totalTime / 1000;
    const baseScore = 10000;
    const timeDeduction = timeInSeconds * 100;
    const score = baseScore - timeDeduction;

    await fetch("/api/result", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        score,
        userName,
      }),
    });

    return { totalTime, score };
  };

  // ランキング取得
  const fetchScores = async () => {
    const response = await fetch("/api/result");
    const data = await response.json();
    return data.results;
  };

  // キー入力処理
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // ゲーム未開始・終了時は無効
      if (!isStarted || isCompleted) return;

      const currentQuestion = questions[currentQuestionIndex];
      const currentChar = currentQuestion.question[currentPosition];
      if (!currentChar) return;

      // 正しいキーが押された場合
      if (e.key.toLowerCase() === currentChar.toLowerCase()) {
        setCurrentPosition((prev) => prev + 1);
      }

      // 問題の最後の文字だった場合
      if (
        e.key.toLowerCase() === currentChar.toLowerCase() &&
        currentPosition === currentQuestion.question.length - 1
      ) {
        // 効果音再生
        if (shotSoundRef.current) {
          shotSoundRef.current.currentTime = 0;
          shotSoundRef.current.play().catch((error) => {
            console.error("Shot sound playback failed:", error);
          });
        }

        // 最後の問題なら終了処理
        if (currentQuestionIndex === questions.length - 1) {
          const { totalTime, score } = await addResult(userName, startTime);
          setTotalTime(totalTime);
          setScore(score);
          setIsCompleted(true);

          const scores = await fetchScores();
          setScores(scores);
        } else {
          // 次の問題へ
          setCurrentQuestionIndex((prev) => prev + 1);
          setCurrentPosition(0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentPosition,
    currentQuestionIndex,
    questions,
    startTime,
    userName,
    isStarted,
    isCompleted,
  ]);

  // ゲーム開始処理
  const handleStart = () => {
    if (!userName) {
      alert("名前を入力してください");
      return;
    }
    setIsStarted(true);
    setStartTime(Date.now());
    setCurrentQuestionIndex(0);
    setCurrentPosition(0);
    setIsCompleted(false);
    setScore(0);
    setTotalTime(0);
  };

  // ゲーム未開始画面
  if (!isStarted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black">
        <div className="text-center p-8 bg-black/50 rounded-lg border border-red-800 shadow-2xl">
          <h1
            className="text-5xl font-bold mb-8 text-red-600 tracking-wider"
            style={{ textShadow: "0 0 10px rgba(255, 0, 0, 0.7)" }}
          >
            Typing Game
          </h1>
          <input
            type="text"
            placeholder="Enter your name..."
            className="w-64 p-3 text-lg bg-black/70 text-red-500 border-2 border-red-800 rounded-md placeholder:text-red-700 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={{ textShadow: "0 0 5px rgba(255, 0, 0, 0.5)" }}
          />
        </div>
        <div>
          <button
            className="px-8 py-3 text-xl bg-red-900 text-white rounded-md hover:bg-red-700 transition-colors duration-300 border border-red-600"
            onClick={handleStart}
            style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)" }}
          >
            Start Game
          </button>
        </div>
      </main>
    );
  }

  // ゲーム終了画面
  if (isCompleted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
        <div className="text-center p-8 bg-black/50 rounded-lg border border-red-800 shadow-2xl max-w-2xl w-full">
          <h2
            className="text-4xl font-bold mb-6 text-red-600"
            style={{ textShadow: "0 0 10px rgba(255, 0, 0, 0.7)" }}
          >
            Result
          </h2>
          <div className="mb-8 space-y-2">
            <p className="text-xl">Player: {userName}</p>
            <p>
              Time
              <span className="text-red-500">
                {(totalTime / 1000).toFixed(2)}
              </span>
              seconds
            </p>
            <p className="text-xl">
              Score:<span className="text-red-500"> {Math.round(score)}</span>
            </p>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-bold text-red-600">Ranking</h3>
            {scores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-red-500 animate-pulse">
                  Loading scores...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {scores.map((score, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-black/50 border border-red-900/50 rounded"
                  >
                    <span
                      className={`text-lg ${
                        score.userName === userName ? "text-red-500" : ""
                      }`}
                    >
                      {index + 1}.{score.userName}
                    </span>
                    <span className="text-red-500">
                      {Math.round(score.score)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* 最初から始めるボタン */}
          <button
            className="mt-8 px-6 py-2 bg-red-800 text-white rounded hover:bg-red-600 transition-colors"
            onClick={() => {
              setIsStarted(false);
              setIsCompleted(false);
              setCurrentQuestionIndex(0);
              setCurrentPosition(0);
              setScore(0);
              setTotalTime(0);
              setScores([]);
            }}
          >
            New Game
          </button>
        </div>
      </main>
    );
  }

  // ゲーム中画面
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div
        className="text-center w-full h-screen bg-cover bg-center flex flex-col items-center justify-center"
        style={{
          backgroundImage: `url(${questions[currentQuestionIndex].image})`,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          backgroundBlendMode: "overlay",
        }}
      >
        <div className="text-white md-8 text-xl">
          問題 {currentQuestionIndex + 1} /{questions.length}
        </div>
        <div
          style={{
            fontSize: "48px",
            margin: "20px 0",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
            fontWeight: "bold",
            letterSpacing: "2px",
          }}
          className="text-white"
        >
          {/* 問題文の表示。正解済み文字は赤色 */}
          {questions[currentQuestionIndex].question
            .split("")
            .map((char, index) => (
              <span
                key={index}
                style={{
                  color: index < currentPosition ? "#ff0000" : "white",
                  textShadow: "2px 2px 4px rgba(0, 0, 0, 0.5)",
                }}
              >
                {char}
              </span>
            ))}
        </div>
      </div>
    </main>
  );
}

// --- 機能追加候補 ---
// タイプミスの集計
// 経過時間の計測
// 問題のランダム性
// 難易度修正
// 最初から始めるボタン
