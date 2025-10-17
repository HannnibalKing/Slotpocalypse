'use client';

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import SlotMachineScene from './scenes/SlotMachineScene';

interface SlotMachineProps {
  credits: number;
  setCredits: (credits: number | ((prev: number) => number)) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export default function SlotMachine({ credits, setCredits, isPlaying, setIsPlaying }: SlotMachineProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);
  const [betAmount, setBetAmount] = useState(10);
  const [sessionTime, setSessionTime] = useState(0);
  const [showBreakReminder, setShowBreakReminder] = useState(false);
  const [showCapReset, setShowCapReset] = useState(false);
  const [spinHistory, setSpinHistory] = useState<Array<{result: 'WIN' | 'LOSS', amount: number}>>([]);

  // Session timer - remind to take breaks
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => {
        const newTime = prev + 1;
        // Remind every 30 minutes (1800 seconds)
        if (newTime % 1800 === 0) {
          setShowBreakReminder(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return;

    console.log('Initializing Phaser game...');
    console.log('Phaser version:', Phaser.VERSION);
    console.log('Game ref:', gameRef.current);

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameRef.current,
      width: 800,
      height: 600,
      backgroundColor: '#3d2817',
      scene: SlotMachineScene,
      physics: {
        default: 'arcade',
        arcade: {
          debug: false
        }
      }
    };

    let game: Phaser.Game | null = null;
    
    try {
      game = new Phaser.Game(config);
      phaserGameRef.current = game;
      console.log('Phaser game created successfully!');
      
      // Listen for game events
      game.events.on('spin-start', () => {
        setIsPlaying(true);
      });

      game.events.on('spin-complete', (win: number) => {
        setIsPlaying(false);
        
        // Track win/loss history
        const netWin = win - betAmount;
        setSpinHistory(prev => {
          const newHistory = [...prev, {
            result: netWin > 0 ? 'WIN' as const : 'LOSS' as const,
            amount: Math.abs(netWin)
          }];
          // Keep only last 10 spins
          return newHistory.slice(-10);
        });
        
        if (win > 0) {
          setCredits(prev => prev + win);
        }
      });
    } catch (error) {
      console.error('Failed to create Phaser game:', error);
    }

    return () => {
      if (game) {
        game.destroy(true);
        phaserGameRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIsPlaying, setCredits]);

  // 🎰 Safety Net: Reset to 10k caps if you run out!
  useEffect(() => {
    if (credits <= 0 && !isPlaying) {
      setShowCapReset(true);
      setTimeout(() => {
        setCredits(10000);
        setShowCapReset(false);
      }, 2000);
    }
  }, [credits, isPlaying, setCredits]);

  const handleSpin = () => {
    if (isPlaying || credits < betAmount) return;
    
    setCredits(prev => prev - betAmount);
    
    if (phaserGameRef.current) {
      phaserGameRef.current.events.emit('start-spin', betAmount);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-8 items-start justify-center">
        {/* Main Game Area */}
        <div>
          {/* Game Canvas */}
          <div ref={gameRef} className="mx-auto rounded-xl overflow-hidden shadow-2xl border-8 border-orange-800" style={{ boxShadow: '0 0 40px rgba(255, 107, 53, 0.5)' }} />
        </div>

        {/* Right Side Panel - Spin History */}
        <div className="bg-black bg-opacity-80 p-6 rounded-xl border-4 border-orange-700 shadow-2xl" style={{ fontFamily: 'Courier New, monospace', width: '300px', maxHeight: '600px' }}>
          <h3 className="text-2xl font-bold mb-4 text-orange-400 text-center border-b-2 border-orange-700 pb-2">
            📊 LAST 10 SPINS
          </h3>
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '500px' }}>
            {spinHistory.length === 0 ? (
              <p className="text-orange-300 text-center italic text-sm mt-8">No spins yet...<br/>Try your luck!</p>
            ) : (
              spinHistory.slice().reverse().map((spin, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 ${
                    spin.result === 'WIN'
                      ? 'bg-green-900 bg-opacity-50 border-green-500'
                      : 'bg-red-900 bg-opacity-50 border-red-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-lg ${
                      spin.result === 'WIN' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {spin.result === 'WIN' ? '✓ WIN' : '✗ LOSS'}
                    </span>
                    <span className={`font-bold ${
                      spin.result === 'WIN' ? 'text-yellow-400' : 'text-orange-400'
                    }`}>
                      {spin.result === 'WIN' ? '+' : '-'}{spin.amount} 🧢
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Break Reminder Modal */}
      {showBreakReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-orange-900 to-red-900 p-8 rounded-xl shadow-2xl max-w-md border-4 border-orange-600" style={{ fontFamily: 'Courier New, monospace' }}>
            <h3 className="text-3xl font-bold mb-4 text-orange-400">☢️ RADIATION WARNING ☢️</h3>
            <p className="mb-2 text-orange-200 text-lg">You&apos;ve been in the wasteland for {formatTime(sessionTime)}.</p>
            <p className="mb-6 text-orange-300">Take a break! Find shelter, drink purified water, and check your RAD levels!</p>
            <p className="text-sm text-orange-400 italic mb-4">&quot;Even the Courier needs rest.&quot;</p>
            <button
              onClick={() => setShowBreakReminder(false)}
              className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold py-3 px-6 rounded-lg transition border-2 border-orange-700"
            >
              Thanks, Mr. House!
            </button>
          </div>
        </div>
      )}

      {/* Cap Reset Notification */}
      {showCapReset && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-green-900 to-emerald-900 p-8 rounded-xl shadow-2xl max-w-md border-4 border-green-500 animate-pulse" style={{ fontFamily: 'Courier New, monospace' }}>
            <h3 className="text-4xl font-bold mb-4 text-green-400">💰 WASTELAND WELFARE 💰</h3>
            <p className="mb-2 text-green-200 text-xl">You&apos;re out of bottle caps!</p>
            <p className="mb-6 text-green-300 text-lg">The NCR is giving you <span className="text-yellow-400 font-bold">10,000 CAPS</span> to keep playing!</p>
            <p className="text-sm text-green-400 italic">&quot;Nobody gets left behind in the Mojave.&quot; - NCR</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-gradient-to-r from-orange-900 to-red-900 rounded-lg p-6 shadow-xl border-4 border-orange-700" style={{ fontFamily: 'Courier New, monospace' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Bet Amount */}
          <div>
            <label className="block text-sm font-bold mb-2 text-orange-300">BET AMOUNT (BOTTLE CAPS)</label>
            <div className="flex gap-2">
              {[10, 25, 50, 100].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  disabled={isPlaying}
                  className={`flex-1 py-2 px-3 rounded font-bold transition border-2 ${
                    betAmount === amount
                      ? 'bg-orange-500 text-black border-orange-700 shadow-lg'
                      : 'bg-orange-950 hover:bg-orange-900 text-orange-200 border-orange-800'
                  } ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Spin Button */}
          <div className="flex items-end">
            <button
              onClick={handleSpin}
              disabled={isPlaying || credits < betAmount}
              className={`w-full py-4 px-6 rounded-lg font-bold text-2xl transition transform border-4 ${
                isPlaying || credits < betAmount
                  ? 'bg-gray-700 cursor-not-allowed text-gray-500 border-gray-600'
                  : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg hover:scale-105 border-orange-700'
              }`}
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
            >
              {isPlaying ? '☢️ SPINNING...' : '⚙️ PULL LEVER!'}
            </button>
          </div>

          {/* Session Info */}
          <div className="space-y-2">
            <div className="bg-orange-950 rounded p-2 border-2 border-orange-800">
              <p className="text-xs text-orange-400 font-bold">SESSION TIME</p>
              <p className="font-bold text-orange-200">{formatTime(sessionTime)}</p>
            </div>
            <div className="bg-orange-950 rounded p-2 border-2 border-orange-800">
              <p className="text-xs text-orange-400 font-bold">CURRENT BET</p>
              <p className="font-bold text-orange-300">{betAmount} Caps</p>
            </div>
          </div>
        </div>

        {/* Warning */}
        {credits < betAmount && (
          <div className="bg-red-900 bg-opacity-70 border-2 border-red-600 rounded p-3 text-center">
            <p className="font-bold text-red-200">☢️ Insufficient bottle caps! Lower your bet or scavenge more.</p>
          </div>
        )}
      </div>

      {/* Paytable */}
      <div className="bg-orange-950 bg-opacity-70 rounded-lg p-6 border-4 border-orange-800" style={{ fontFamily: 'Courier New, monospace' }}>
        <h3 className="text-2xl font-bold mb-6 text-center text-orange-400" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
          ☢️ WASTELAND PAYTABLE ☢️
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
          <div className="bg-orange-900 bg-opacity-50 p-4 rounded border-2 border-orange-700">
            <div className="text-5xl mb-2" style={{ fontFamily: 'Segoe UI Emoji, Arial, sans-serif' }}>💀💀💀</div>
            <p className="text-orange-400 font-bold text-lg">3x Caps</p>
            <p className="text-xs text-orange-300">Death Claws</p>
          </div>
          <div className="bg-orange-900 bg-opacity-50 p-4 rounded border-2 border-orange-700">
            <div className="text-5xl mb-2" style={{ fontFamily: 'Segoe UI Emoji, Arial, sans-serif' }}>💊💊💊</div>
            <p className="text-orange-400 font-bold text-lg">5x Caps</p>
            <p className="text-xs text-orange-300">Stimpaks</p>
          </div>
          <div className="bg-orange-900 bg-opacity-50 p-4 rounded border-2 border-orange-700">
            <div className="text-5xl mb-2" style={{ fontFamily: 'Segoe UI Emoji, Arial, sans-serif' }}>🎯🎯🎯</div>
            <p className="text-orange-400 font-bold text-lg">8x Caps</p>
            <p className="text-xs text-orange-300">Lucky Shot</p>
          </div>
          <div className="bg-orange-900 bg-opacity-50 p-4 rounded border-2 border-orange-700">
            <div className="text-5xl mb-2" style={{ fontFamily: 'Segoe UI Emoji, Arial, sans-serif' }}>⚙⚙⚙</div>
            <p className="text-orange-400 font-bold text-lg">15x Caps</p>
            <p className="text-xs text-orange-300">Scrap Metal</p>
          </div>
          <div className="bg-orange-900 bg-opacity-50 p-4 rounded border-2 border-orange-700">
            <div className="text-5xl mb-2" style={{ fontFamily: 'Segoe UI Emoji, Arial, sans-serif' }}>🔫🔫🔫</div>
            <p className="text-orange-400 font-bold text-lg">25x Caps</p>
            <p className="text-xs text-orange-300">Plasma Rifle</p>
          </div>
          <div className="bg-red-900 bg-opacity-70 p-4 rounded border-4 border-red-600 animate-pulse">
            <div className="text-5xl mb-2" style={{ fontFamily: 'Segoe UI Emoji, Arial, sans-serif' }}>☢☢☢</div>
            <p className="text-red-400 font-bold text-xl">100x Caps!</p>
            <p className="text-xs text-red-300">NUCLEAR JACKPOT!</p>
          </div>
        </div>
        
        {/* Pair Wins Section */}
        <div className="mt-6 bg-green-900 bg-opacity-30 p-4 rounded-lg border-2 border-green-700">
          <h4 className="text-lg font-bold mb-3 text-center text-green-400">💰 PAIR WINS (2 Matching) 💰</h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center text-sm">
            <div className="bg-green-800 bg-opacity-40 p-2 rounded">
              <div className="text-2xl mb-1" style={{ fontFamily: 'Segoe UI Emoji, Arial, sans-serif' }}>💀💀</div>
              <p className="text-green-400 font-bold">1.5x</p>
            </div>
            <div className="bg-green-800 bg-opacity-40 p-2 rounded">
              <div className="text-2xl mb-1" style={{ fontFamily: 'Segoe UI Emoji, Arial, sans-serif' }}>💊💊</div>
              <p className="text-green-400 font-bold">2x</p>
            </div>
            <div className="bg-green-800 bg-opacity-40 p-2 rounded">
              <div className="text-2xl mb-1" style={{ fontFamily: 'Segoe UI Emoji, Arial, sans-serif' }}>🎯🎯</div>
              <p className="text-green-400 font-bold">2.5x</p>
            </div>
            <div className="bg-green-800 bg-opacity-40 p-2 rounded">
              <div className="text-2xl mb-1" style={{ fontFamily: 'Segoe UI Emoji, Arial, sans-serif' }}>⚙⚙</div>
              <p className="text-green-400 font-bold">3x</p>
            </div>
            <div className="bg-green-800 bg-opacity-40 p-2 rounded">
              <div className="text-2xl mb-1" style={{ fontFamily: 'Segoe UI Emoji, Arial, sans-serif' }}>🔫🔫</div>
              <p className="text-green-400 font-bold">4x</p>
            </div>
            <div className="bg-green-800 bg-opacity-40 p-2 rounded">
              <div className="text-2xl mb-1" style={{ fontFamily: 'Segoe UI Emoji, Arial, sans-serif' }}>☢☢</div>
              <p className="text-green-400 font-bold">10x</p>
            </div>
          </div>
        </div>
        
        <p className="text-center mt-6 text-orange-400 italic text-sm">
          &quot;The house always wins... unless you&apos;re lucky.&quot; - Mr. House
        </p>
      </div>
    </div>
  );
}
