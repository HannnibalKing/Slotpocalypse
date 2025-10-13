'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const SlotMachine = dynamic(() => import('@/components/SlotMachine'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-screen">
    <div className="text-2xl animate-pulse">Loading Slot Machine...</div>
  </div>
});

export default function Home() {
  const [credits, setCredits] = useState(1000);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <main className="min-h-screen p-8 relative">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-6xl font-bold mb-2 text-orange-500" style={{ fontFamily: 'Courier New, monospace', textShadow: '4px 4px 8px rgba(0,0,0,0.8)' }}>
          ☢️ MOJAVE WASTELAND SLOTS ☢️
        </h1>
        <p className="text-orange-300 text-xl font-semibold" style={{ fontFamily: 'Courier New, monospace' }}>
          New Vegas Casino • Since 2281 • War Never Changes
        </p>
        <p className="text-gray-400 text-sm mt-2">Play Responsibly in the Wasteland</p>
      </header>

      {/* Credits Display */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-orange-900 to-red-900 rounded-lg p-4 shadow-2xl border-4 border-orange-600" style={{ fontFamily: 'Courier New, monospace' }}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-orange-200 font-bold">BOTTLE CAPS</p>
              <p className="text-5xl font-bold text-orange-400" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                {credits.toLocaleString()}
              </p>
              <p className="text-xs text-orange-300 mt-1">Post-War Currency</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-orange-200 font-bold">STATUS</p>
              <p className={`text-2xl font-bold ${isPlaying ? 'text-green-400 animate-pulse' : 'text-orange-300'}`}>
                {isPlaying ? '☢️ SPINNING' : '⚙️ READY'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Slot Machine Game */}
      <div className="max-w-6xl mx-auto">
        <SlotMachine 
          credits={credits}
          setCredits={setCredits}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      </div>

      {/* Responsible Gaming Footer */}
      <footer className="mt-12 text-center text-sm text-orange-400" style={{ fontFamily: 'Courier New, monospace' }}>
        <div className="max-w-2xl mx-auto space-y-2 bg-orange-950 bg-opacity-50 p-6 rounded-lg border-2 border-orange-700">
          <p className="text-orange-500 font-bold text-lg">⚠️ WASTELAND RESPONSIBLE GAMING ⚠️</p>
          <p className="text-orange-300">This is a demo game for entertainment purposes only.</p>
          <p className="text-orange-300">Set limits, take breaks, hydrate with purified water!</p>
          <p className="text-orange-300 italic">"War Never Changes, but your habits can."</p>
          <div className="flex justify-center gap-4 mt-4">
            <span className="px-3 py-1 bg-orange-900 rounded border border-orange-600">18+</span>
            <span className="px-3 py-1 bg-orange-900 rounded border border-orange-600">NCR Approved</span>
            <span className="px-3 py-1 bg-orange-900 rounded border border-orange-600">☢️ Rad-Free</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
