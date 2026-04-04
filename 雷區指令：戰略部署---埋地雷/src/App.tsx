import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { Bomb, RefreshCw, Trophy, AlertTriangle, ChevronRight, LayoutGrid, User, ShieldAlert, Sparkles } from 'lucide-react';
import { LEVELS, MineSolver, Level } from './gameLogic';

interface GameState {
  gameId: number;
  level: Level;
  placedNumbers: { x: number; y: number; value: number }[];
  revealedMines: Set<string>;
  revealedClear: Set<string>;
  revealedDebris: Set<string>;
  hand: number[];
  placedInTurn: number;
  status: 'playing' | 'won' | 'lost' | 'exploding';
  message: string;
  conflictCells: { x: number; y: number }[];
}

const Soldier = ({ x, y, cellSize }: { x: number; y: number; cellSize: number }) => (
  <motion.div
    initial={{ x: -100, y: -100, opacity: 0 }}
    animate={{ x: x * (cellSize + 4), y: y * (cellSize + 4), opacity: 1 }}
    transition={{ type: "spring", stiffness: 100, damping: 15 }}
    className="absolute pointer-events-none z-30"
    style={{ width: cellSize, height: cellSize }}
  >
    <div className="w-full h-full flex items-center justify-center">
      <div className="bg-emerald-600 rounded-full p-1 shadow-lg border-2 border-slate-800">
        <User size={cellSize * 0.6} className="text-white" />
      </div>
    </div>
  </motion.div>
);

const GameCell = React.memo(({ 
  x, y, 
  placed, isMine, isClear, isDebris, isConflict, isExploding, 
  status, onClick 
}: { 
  x: number; y: number; 
  placed?: { value: number }; 
  isMine: boolean; isClear: boolean; isDebris: boolean; isConflict: boolean; isExploding: boolean;
  status: string;
  onClick: (x: number, y: number) => void;
}) => {
  return (
    <motion.div
      whileHover={status === 'playing' ? { scale: 1.05, backgroundColor: '#1e293b' } : {}}
      onClick={() => onClick(x, y)}
      className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all relative
        ${isConflict ? 'bg-red-600 border-2 border-white shadow-lg z-10 ring-4 ring-red-500/50 animate-pulse' :
          placed ? 'bg-amber-900/40 border-2 border-amber-500' : 
          isMine ? 'bg-red-950/40 border border-red-900' :
          isClear ? 'bg-emerald-950/40 border border-emerald-900' :
          isDebris ? 'bg-slate-950 border border-slate-900 shadow-inner' :
          'bg-slate-800 border border-slate-700 hover:border-amber-500/50'}
      `}
    >
      {isDebris && !placed && !isMine && !isClear && (
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <div className="w-full h-full bg-[radial-gradient(circle,_#1e293b_0%,_transparent_70%)] opacity-50" />
          <div className="w-1 h-1 bg-slate-700 rounded-full absolute top-2 left-3" />
          <div className="w-1.5 h-1 bg-slate-800 rounded-full absolute bottom-3 right-2 rotate-12" />
          <div className="w-2 h-0.5 bg-slate-800 absolute top-4 right-3 -rotate-45" />
        </div>
      )}
      {placed && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`text-xl font-black ${isConflict ? 'text-white' : 'text-amber-400'}`}
        >
          {placed.value}
        </motion.span>
      )}
      {isMine && !placed && (
        <motion.div
          animate={isExploding ? { 
            scale: [1, 2, 0], 
            rotate: [0, 90, 180],
            backgroundColor: ['#fee2e2', '#ef4444', '#000']
          } : {}}
          transition={{ duration: 0.5, delay: Math.random() * 0.5 }}
        >
          <Bomb size={20} className={`${isExploding ? 'text-white' : 'text-red-400 opacity-60'}`} />
        </motion.div>
      )}
      {isClear && !placed && !isMine && (
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
      )}
    </motion.div>
  );
});

export default function App() {
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedHandIndex, setSelectedHandIndex] = useState<number | null>(null);
  const [movingSoldier, setMovingSoldier] = useState<{ x: number; y: number; value: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const generateHand = useCallback((level: Level, placedNumbers: { x: number; y: number; value: number }[]) => {
    const weights: Record<number, number> = {
      1: 5,
      2: 15,
      3: 25,
      4: 25,
      5: 15,
      6: 10,
      7: 3,
      8: 2
    };
    
    const getRandomWeighted = () => {
      const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
      let r = Math.random() * totalWeight;
      for (const [num, weight] of Object.entries(weights)) {
        r -= weight;
        if (r <= 0) return parseInt(num);
      }
      return 4;
    };

    // Find valid numbers for current board
    const validNumbers = new Set<number>();
    const emptyCells = level.cells.filter(c => !placedNumbers.some(p => p.x === c.x && p.y === c.y));
    
    // To avoid heavy computation, we'll sample some empty cells
    const sampleCells = emptyCells.sort(() => Math.random() - 0.5).slice(0, 8);
    
    for (const cell of sampleCells) {
      // Check which numbers are valid for this cell
      const possibleValues = [1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
      for (const v of possibleValues) {
        const testPlaced = [...placedNumbers, { x: cell.x, y: cell.y, value: v }];
        const solver = new MineSolver(level.cells, testPlaced);
        if (solver.isValid()) {
          validNumbers.add(v);
          if (validNumbers.size >= 3) break;
        }
      }
      if (validNumbers.size >= 3) break;
    }

    const validArray = Array.from(validNumbers);
    const hand: number[] = [];
    
    // Ensure 1-2 valid numbers if any exist
    if (validArray.length > 0) {
      const numValidToInclude = Math.min(validArray.length, Math.floor(Math.random() * 2) + 1); // 1 or 2
      for (let i = 0; i < numValidToInclude; i++) {
        const idx = Math.floor(Math.random() * validArray.length);
        hand.push(validArray[idx]);
        validArray.splice(idx, 1);
      }
    }
    
    // Fill the rest with weighted random
    while (hand.length < 3) {
      hand.push(getRandomWeighted());
    }
    
    return hand.sort(() => Math.random() - 0.5);
  }, []);

  const initGame = useCallback((levelIndex: number) => {
    const level = LEVELS[levelIndex];
    setGameState({
      gameId: Date.now(),
      level,
      placedNumbers: [],
      revealedMines: new Set(),
      revealedClear: new Set(),
      revealedDebris: new Set(),
      hand: generateHand(level, []),
      placedInTurn: 0,
      status: 'playing',
      message: '報告長官！請指示下一個埋雷座標！',
      conflictCells: [],
    });
    setSelectedHandIndex(null);
    setMovingSoldier(null);
  }, [generateHand]);

  useEffect(() => {
    initGame(currentLevelIndex);
  }, [currentLevelIndex, initGame]);

  const handleCellClick = async (x: number, y: number) => {
    if (!gameState || gameState.status !== 'playing' || selectedHandIndex === null || movingSoldier) return;

    const cellKey = `${x},${y}`;
    if (gameState.placedNumbers.some(p => p.x === x && p.y === y)) return;
    if (gameState.revealedMines.has(cellKey)) return;

    const newValue = gameState.hand[selectedHandIndex];
    
    // Start soldier movement
    setMovingSoldier({ x, y, value: newValue });
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const newPlacedNumbers = [...gameState.placedNumbers, { x, y, value: newValue }];
    const solver = new MineSolver(gameState.level.cells, newPlacedNumbers);
    
    const conflicts = solver.getConflicts();
    
    if (conflicts) {
      setGameState(prev => prev ? {
        ...prev,
        status: 'exploding',
        message: `糟了！長官指示錯誤！地雷引爆了！`,
        placedNumbers: newPlacedNumbers,
        conflictCells: conflicts
      } : null);
      
      // Trigger chain reaction explosion
      setTimeout(() => {
        setGameState(prev => {
          if (!prev) return null;
          const newDebris = new Set<string>();
          // Randomly turn some cells into debris
          prev.level.cells.forEach(c => {
            if (Math.random() > 0.6) newDebris.add(`${c.x},${c.y}`);
          });
          return { ...prev, status: 'lost', revealedDebris: newDebris };
        });
      }, 1500);
      
      setMovingSoldier(null);
      return;
    }

    // Success placement
    const forced = solver.findForced(newPlacedNumbers);
    const newRevealedMines = new Set(gameState.revealedMines);
    const newRevealedClear = new Set(gameState.revealedClear);
    forced.mines.forEach(m => newRevealedMines.add(m));
    forced.clear.forEach(c => newRevealedClear.add(c));

    const newHand = [...gameState.hand];
    newHand.splice(selectedHandIndex, 1);
    
    let nextPlacedInTurn = gameState.placedInTurn + 1;
    let finalHand = newHand;
    let finalPlacedInTurn = nextPlacedInTurn;

    if (nextPlacedInTurn === 2) {
      finalHand = generateHand(gameState.level, newPlacedNumbers);
      finalPlacedInTurn = 0;
    }

    const totalKnown = newPlacedNumbers.length + newRevealedMines.size + newRevealedClear.size;
    const fillPercentage = (totalKnown / gameState.level.cells.length) * 100;
    
    if (fillPercentage >= 80) {
      setGameState(prev => prev ? {
        ...prev,
        placedNumbers: newPlacedNumbers,
        revealedMines: newRevealedMines,
        revealedClear: newRevealedClear,
        hand: finalHand,
        placedInTurn: finalPlacedInTurn,
        status: 'won',
        message: '報告長官！任務圓滿達成！'
      } : null);
    } else {
      setGameState(prev => prev ? {
        ...prev,
        placedNumbers: newPlacedNumbers,
        revealedMines: newRevealedMines,
        revealedClear: newRevealedClear,
        hand: finalHand,
        placedInTurn: finalPlacedInTurn,
        message: finalPlacedInTurn === 0 ? '長官，新的指示來了！' : '小兵正在埋雷，請下達下一個指令！'
      } : null);
    }
    
    setMovingSoldier(null);
    setSelectedHandIndex(null);
  };

  if (!gameState) return null;

  const totalKnown = gameState.placedNumbers.length + gameState.revealedMines.size + gameState.revealedClear.size;
  const fillPercentage = (totalKnown / gameState.level.cells.length) * 100;
  const cellSize = 40; // Base cell size for soldier positioning

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans p-4 md:p-8 flex flex-col items-center selection:bg-amber-500/30">
      {/* Header */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-4"
        >
          <div className="bg-slate-900 p-3 rounded-2xl shadow-lg border-2 border-slate-800">
            <Bomb className="text-amber-500" size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white mb-0 flex items-center gap-2">
              雷區指令：戰略部署
            </h1>
            <p className="text-slate-500 font-medium text-sm">長官指示，精準埋雷！</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-4 bg-slate-900 p-4 rounded-3xl border-2 border-slate-800 shadow-xl"
        >
          <div className="text-center px-2">
            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">任務進度</div>
            <div className="text-2xl font-black text-emerald-500">{fillPercentage.toFixed(1)}%</div>
          </div>
          <div className="h-10 w-0.5 bg-slate-800" />
          <div className="text-center px-2">
            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">目標</div>
            <div className="text-2xl font-black text-slate-600">80%</div>
          </div>
          <button 
            onClick={() => initGame(currentLevelIndex)}
            className="ml-2 p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl transition-all active:scale-95"
            title="重新開始"
          >
            <RefreshCw size={20} />
          </button>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar: Levels */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-800 shadow-xl">
            <h2 className="text-lg font-black mb-4 flex items-center gap-2 text-white">
              <LayoutGrid size={18} className="text-amber-500" /> 選擇戰區
            </h2>
            <div className="space-y-2">
              {LEVELS.map((level, idx) => (
                <button
                  key={level.id}
                  onClick={() => setCurrentLevelIndex(idx)}
                  className={`w-full text-left px-4 py-3 rounded-2xl transition-all flex items-center justify-between group ${
                    currentLevelIndex === idx 
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40' 
                      : 'bg-slate-800/50 text-slate-500 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span className="font-bold">{level.name}</span>
                  <ChevronRight size={16} className={`transition-transform ${currentLevelIndex === idx ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-800 shadow-xl text-sm leading-relaxed text-slate-400">
            <h3 className="text-amber-500 font-black mb-3 uppercase tracking-wider text-xs flex items-center gap-2">
              <ShieldAlert size={14} /> 戰略指南
            </h3>
            <ul className="space-y-3">
              <li className="flex gap-2">
                <span className="text-amber-600 font-bold">1.</span>
                <span>長官（你）從手牌選一個數字。</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 font-bold">2.</span>
                <span>點擊地圖，小兵會跑去埋雷。</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 font-bold">3.</span>
                <span>數字代表周圍有幾顆雷，不能算錯喔！</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-600 font-bold">4.</span>
                <span>一旦邏輯矛盾，地雷就會<span className="text-red-500 font-bold">連環爆炸</span>！</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Game Board */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div 
            ref={boardRef}
            key={gameState.gameId}
            className="relative bg-slate-900 p-4 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl overflow-hidden"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${gameState.level.width}, minmax(0, 1fr))`,
              gap: '4px',
              width: 'fit-content'
            }}
          >
            {/* Moving Soldier */}
            {movingSoldier && (
              <Soldier x={movingSoldier.x} y={movingSoldier.y} cellSize={cellSize} />
            )}

            {/* Grid Cells */}
            {Array.from({ length: gameState.level.width * gameState.level.height }).map((_, i) => {
              const x = i % gameState.level.width;
              const y = Math.floor(i / gameState.level.width);
              const isValid = gameState.level.cells.some(c => c.x === x && c.y === y);
              
              if (!isValid) return <div key={i} className="w-10 h-10" />;

              const placed = gameState.placedNumbers.find(p => p.x === x && p.y === y);
              const isMine = gameState.revealedMines.has(`${x},${y}`);
              const isClear = gameState.revealedClear.has(`${x},${y}`);
              const isDebris = gameState.revealedDebris.has(`${x},${y}`);
              const isConflict = gameState.conflictCells.some(c => c.x === x && c.y === y);
              const isExploding = gameState.status === 'exploding' && isMine;

              return (
                <GameCell
                  key={`${gameState.gameId}-${i}`}
                  x={x}
                  y={y}
                  placed={placed}
                  isMine={isMine}
                  isClear={isClear}
                  isDebris={isDebris}
                  isConflict={isConflict}
                  isExploding={isExploding}
                  status={gameState.status}
                  onClick={handleCellClick}
                />
              );
            })}
          </div>

          {/* Status Message */}
          <div className="mt-8 text-center w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={gameState.message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="bg-slate-900 px-6 py-4 rounded-3xl shadow-lg border-2 border-slate-800 inline-block">
                  <p className={`font-black text-lg ${
                    gameState.status === 'lost' || gameState.status === 'exploding' ? 'text-red-500' : 
                    gameState.status === 'won' ? 'text-emerald-500' : 'text-slate-300'
                  }`}>
                    {gameState.message}
                  </p>
                </div>
                
                {(gameState.status === 'lost' || gameState.status === 'won') && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex gap-4 justify-center"
                  >
                    <button
                      onClick={() => initGame(currentLevelIndex)}
                      className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all shadow-lg border border-slate-700 active:scale-95 flex items-center gap-2"
                    >
                      <RefreshCw size={20} /> 再試一次
                    </button>
                    {gameState.status === 'won' && currentLevelIndex < LEVELS.length - 1 && (
                      <button
                        onClick={() => setCurrentLevelIndex(prev => prev + 1)}
                        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-900/40 active:scale-95 flex items-center gap-2"
                      >
                        下一關 <ChevronRight size={20} />
                      </button>
                    )}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Player Hand / Commander Area */}
        <div className="lg:col-span-3">
          <div className="bg-slate-900 p-6 rounded-[2.5rem] border-2 border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <User size={80} className="text-white" />
            </div>
            
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div>
                <h2 className="text-lg font-black text-white">長官指令</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Commander's Orders</p>
              </div>
              <div className="flex gap-1.5">
                <motion.div 
                  animate={gameState.placedInTurn >= 1 ? { scale: [1, 1.2, 1] } : {}}
                  className={`w-3 h-3 rounded-full ${gameState.placedInTurn >= 1 ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-800'}`} 
                />
                <motion.div 
                  animate={gameState.placedInTurn >= 2 ? { scale: [1, 1.2, 1] } : {}}
                  className={`w-3 h-3 rounded-full ${gameState.placedInTurn >= 2 ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-800'}`} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 relative z-10">
              {gameState.hand.map((num, idx) => (
                <motion.button
                  key={`${gameState.gameId}-${idx}-${num}`}
                  whileHover={gameState.status === 'playing' ? { y: -5, scale: 1.05 } : {}}
                  whileTap={gameState.status === 'playing' ? { scale: 0.9 } : {}}
                  disabled={gameState.status !== 'playing' || movingSoldier !== null}
                  onClick={() => setSelectedHandIndex(idx)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-3xl font-black transition-all border-4
                    ${selectedHandIndex === idx 
                      ? 'bg-amber-600 border-amber-400 text-white shadow-xl shadow-amber-900/40 scale-110' 
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-400 hover:bg-slate-700'
                    }
                    ${(gameState.status !== 'playing' || movingSoldier !== null) ? 'opacity-40 cursor-not-allowed' : ''}
                  `}
                >
                  {num}
                </motion.button>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-slate-950/50 rounded-2xl border-2 border-dashed border-slate-800 text-xs text-slate-500 font-bold text-center">
              {gameState.status === 'exploding' ? (
                <span className="text-red-500 animate-pulse">！！！連環爆炸中！！！</span>
              ) : gameState.status !== 'playing' ? (
                "任務結束。"
              ) : selectedHandIndex === null 
                ? "點選數字，下達埋雷指令！" 
                : `命令小兵去埋下數字 ${gameState.hand[selectedHandIndex]}！`}
            </div>
          </div>
        </div>
      </div>

      {/* Victory Celebration */}
      <AnimatePresence>
        {gameState.status === 'won' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div 
              initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              className="bg-slate-900 border-4 border-emerald-500 p-10 rounded-[3rem] shadow-[0_20px_50px_rgba(16,185,129,0.3)] text-center pointer-events-auto relative"
            >
              <div className="absolute -top-10 -left-10 text-amber-400 animate-bounce">
                <Sparkles size={60} />
              </div>
              <div className="absolute -bottom-10 -right-10 text-amber-400 animate-bounce delay-300">
                <Sparkles size={60} />
              </div>
              
              <div className="w-24 h-24 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy size={48} className="text-emerald-500" />
              </div>
              <h2 className="text-4xl font-black text-white mb-2">任務成功！</h2>
              <p className="text-emerald-500 font-bold mb-8">覆蓋率達 {fillPercentage.toFixed(1)}%</p>
              <button
                onClick={() => initGame(currentLevelIndex)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-900/40"
              >
                繼續挑戰
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
