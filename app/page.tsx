"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
// Using lucide-react as per guidelines
import { Brain, Trophy, Info as InfoIcon, Moon, Sun, Settings as SettingsIcon, HelpCircle, ShieldCheck, FileText, Play, UserPlus, Upload, X, Camera } from 'lucide-react';

type Color = 'green' | 'red' | 'yellow' | 'blue';

const COLORS: Color[] = ['green', 'red', 'yellow', 'blue'];

const FREQUENCIES: Record<Color, number> = {
  green: 329.63,
  red: 261.63,
  yellow: 391.0,
  blue: 523.25,
};

export default function App() {
  const [sequence, setSequence] = useState < Color[] > ([]);
  const [userSequence, setUserSequence] = useState < Color[] > ([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [activeColor, setActiveColor] = useState < Color | null > (null);
  const [gameState, setGameState] = useState < 'idle' | 'playing' | 'gameOver' > ('idle');
  const [highScore, setHighScore] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

  const audioContextRef = useRef < AudioContext | null > (null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextConstructor();
    }
  }, []);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('simon-high-score');
    if (savedHighScore) setHighScore(parseInt(savedHighScore));
  }, []);

  const playTone = useCallback((frequency: number, duration = 0.35) => {
    const context = audioContextRef.current;
    if (!context) return;
    if (context.state === 'suspended') context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.5, context.currentTime + 0.01);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.stop(context.currentTime + duration + 0.05);
  }, []);

  const playSound = useCallback((color: Color) => {
    initAudioContext();
    const frequency = FREQUENCIES[color];
    playTone(frequency);
  }, [initAudioContext, playTone]);

  const playErrorTone = useCallback(() => {
    initAudioContext();
    playTone(150, 0.5);
  }, [initAudioContext, playTone]);

  const startNewGame = () => {
    setGameState('playing');
    const firstColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    setSequence([firstColor]);
    setUserSequence([]);
    showSequence([firstColor]);
  };

  const showSequence = async (seq: Color[]) => {
    setIsShowingSequence(true);
    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setActiveColor(seq[i]);
      playSound(seq[i]);
      await new Promise(resolve => setTimeout(resolve, 400));
      setActiveColor(null);
    }
    setIsShowingSequence(false);
  };

  const handleColorClick = (color: Color) => {
    if (isShowingSequence || gameState !== 'playing') return;

    playSound(color);
    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 200);

    const newUserSequence = [...userSequence, color];
    setUserSequence(newUserSequence);

    // Check if the move is correct
    const currentStep = newUserSequence.length - 1;
    if (newUserSequence[currentStep] !== sequence[currentStep]) {
      handleGameOver();
      return;
    }

    // Check if sequence is complete
    if (newUserSequence.length === sequence.length) {
      if (sequence.length > highScore) {
        setHighScore(sequence.length);
        localStorage.setItem('simon-high-score', sequence.length.toString());
      }

      setTimeout(() => {
        const nextColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        const nextSequence = [...sequence, nextColor];
        setSequence(nextSequence);
        setUserSequence([]);
        showSequence(nextSequence);
      }, 1000);
    }
  };

  const handleGameOver = () => {
    playErrorTone();
    setGameState('gameOver');
    setSequence([]);
    setUserSequence([]);
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen transition-colors duration-300`}>
      <div className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen font-sans">
        {/* Navigation */}
        <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Brain className="text-white w-5 h-5" />
              </div>
              <h1 className="font-display text-xl font-bold tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                Simon Pro
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4 text-base font-medium">
                <a href="#" className="hover:text-blue-600 transition-colors">Juegos</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Logros</a>
                <a href="#" className="hover:text-blue-600 transition-colors">Comunidad</a>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-4 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
              </button>
              <button
                onClick={() => setIsPlayerModalOpen(true)}
                className="p-4 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Inscribir jugador"
              >
                <UserPlus className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-300 dark:border-slate-700">
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                  alt="User avatar"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Sidebar - Leaderboard */}
            <aside className="lg:col-span-3 order-2 lg:order-1">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="font-bold flex items-center gap-2">
                    <Trophy className="text-yellow-500 w-5 h-5" />
                    Clasificación mundial
                  </h2>
                </div>
                <div className="p-2">
                  <div className="space-y-1">
                    {[
                      { name: 'TurboMax', score: 42, rank: '01', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
                      { name: 'NeonCat', score: 38, rank: '02', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
                      { name: 'MemoryMaster', score: 35, rank: '03', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
                      { name: 'CircuitBox', score: 31, rank: '04', img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
                    ].map((player) => (
                      <div key={player.rank} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-display text-xs text-slate-400 w-4">{player.rank}</span>
                          <img
                            src={player.img}
                            alt={player.name}
                            className="w-8 h-8 rounded-full bg-slate-200"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-sm font-medium">{player.name}</span>
                        </div>
                        <span className="font-display text-blue-600 font-bold">{player.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 text-center">
                  <button className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest">Ver la clasificación completa</button>
                </div>
              </div>
            </aside>

            {/* Center - Game Board */}
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-8">
              <div className="flex justify-center gap-10 md:gap-20">
                <div className="text-center">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">Nivel Actual</p>
                  <p className="font-display text-6xl font-bold text-slate-900 dark:text-white">
                    {gameState === 'playing' ? sequence.length.toString().padStart(2, '0') : '00'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mb-1">Puntaje Alto</p>
                  <p className="font-display text-6xl font-bold text-blue-600">{highScore.toString().padStart(2, '0')}</p>
                </div>
              </div>

              <div className="relative flex justify-center py-4">
                <div className="relative w-80 h-80 sm:w-[520px] sm:h-[520px] md:w-[560px] md:h-[560px] bg-slate-950 rounded-full p-4 shadow-[0_30px_80px_rgba(15,23,42,0.6)] border-8 border-slate-900 dark:border-slate-800 ring-4 ring-slate-800 dark:ring-slate-900">
                  <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full w-full">
                    <button
                      onClick={() => handleColorClick('green')}
                      className={`simon-btn bg-green-500 text-green-500 rounded-tl-full ${activeColor === 'green' ? 'active' : ''}`}
                    >
                      <div className="glossy-overlay absolute inset-0"></div>
                    </button>
                    <button
                      onClick={() => handleColorClick('red')}
                      className={`simon-btn bg-red-500 text-red-500 rounded-tr-full ${activeColor === 'red' ? 'active' : ''}`}
                    >
                      <div className="glossy-overlay absolute inset-0"></div>
                    </button>
                    <button
                      onClick={() => handleColorClick('yellow')}
                      className={`simon-btn bg-yellow-500 text-yellow-500 rounded-bl-full ${activeColor === 'yellow' ? 'active' : ''}`}
                    >
                      <div className="glossy-overlay absolute inset-0"></div>
                    </button>
                    <button
                      onClick={() => handleColorClick('blue')}
                      className={`simon-btn bg-blue-500 text-blue-500 rounded-br-full ${activeColor === 'blue' ? 'active' : ''}`}
                    >
                      <div className="glossy-overlay absolute inset-0"></div>
                    </button>
                  </div>

                  {/* Center Control Panel */}
                  <div className="absolute inset-1/4 rounded-full bg-slate-900 border-8 border-slate-950 shadow-inner flex flex-col items-center justify-center z-10">
                    <div className="w-full h-1/2 flex items-end justify-center pb-2">
                      <h3 className="font-display font-bold text-xl sm:text-2xl italic text-slate-400 tracking-tighter select-none">SIMON</h3>
                    </div>
                    <div className="w-full h-1/2 flex flex-col items-center justify-start gap-3">
                      {gameState !== 'playing' ? (
                        <button
                          onClick={startNewGame}
                          className="group relative px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-display font-bold rounded-full text-sm sm:text-base transition-all transform active:scale-95 shadow-lg shadow-blue-600/20"
                        >
                          {gameState === 'gameOver' ? 'RETRY' : 'START'}
                          <div className="absolute -inset-1 rounded-full bg-blue-600/20 blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 text-blue-500 text-base">
                          <Play className="w-4 h-4 fill-current" />
                          <span className="text-xs font-bold uppercase tracking-widest">Live</span>
                        </div>
                      )}
                      <div className="speaker-grill w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-slate-800"></div>
                    </div>
                  </div>
                </div>

                {/* Background Glow */}
                <div className="absolute -z-10 w-full h-full max-w-lg max-h-lg bg-blue-600/10 blur-[100px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>
              </div>

              <div className="text-center h-8">
                <AnimatePresence mode="wait">
                  {gameState === 'gameOver' && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-500 font-bold uppercase tracking-widest"
                    >
                      ¡Juego terminado! ¿Inténtalo de nuevo?
                    </motion.p>
                  )}
                  {gameState === 'playing' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-slate-500 dark:text-slate-400 text-sm animate-pulse"
                    >
                      {isShowingSequence ? 'Listen to the sequence...' : 'Your turn! Repeat the pattern'}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Sidebar - Instructions */}
            <aside className="lg:col-span-3 order-3">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-6">
                  <h2 className="font-bold flex items-center gap-2 mb-4 text-2xl">
                    <InfoIcon className="text-blue-600 w-5 h-5" />
                    Cómo jugar
                  </h2>
                  <ul className="space-y-4">
                    {[
                      'Simon reproducirá una serie de tonos e iluminará los sectores.',
                      'Espera a que termine Simon y luego repite la secuencia en el orden exacto.',
                      'Cada ronda correcta añade un paso más a la secuencia. ¿Hasta dónde puedes llegar?'
                    ].map((text, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold">{i + 1}</div>
                        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">{text}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 p-4 bg-blue-600/5 rounded-xl border border-blue-600/20">
                    <p className="text-sm md:text-base font-bold text-blue-600 uppercase mb-2">Consejo pro</p>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      Enfócate en el ritmo y los sonidos más que en los colores para mejorar tu memoria.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 justify-center lg:justify-start">
                <a href="#" className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1"><SettingsIcon className="w-3 h-3" /> Settings</a>
                <a href="#" className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Help Center</a>
                <a href="#" className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Privacy</a>
                <a href="#" className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1"><FileText className="w-3 h-3" /> Terms</a>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
