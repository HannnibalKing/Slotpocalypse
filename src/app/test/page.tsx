'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-orange-900 to-red-900">
      <h1 className="text-4xl font-bold text-orange-400 text-center mb-4">
        ☢️ TEST PAGE ☢️
      </h1>
      <div className="max-w-2xl mx-auto bg-orange-950 p-8 rounded-lg border-4 border-orange-600">
        <p className="text-orange-200 mb-4">If you can see this, Next.js is working!</p>
        <p className="text-orange-300">Now checking Phaser...</p>
      </div>
    </div>
  );
}
