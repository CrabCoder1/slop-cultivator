import { Button } from './ui/button';
import { Menu, Volume2, VolumeX, X } from 'lucide-react';

interface UIShowcaseProps {
  onClose: () => void;
}

export function UIShowcase({ onClose }: UIShowcaseProps) {
  return (
    <div className="fixed inset-0 bg-slate-900 overflow-y-auto z-50">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-amber-300 text-3xl">UI Element Showcase</h1>
          <Button onClick={onClose} variant="outline" className="border-amber-600 text-amber-300">
            <X className="size-4 mr-2" />
            Close
          </Button>
        </div>

        {/* Game Characters Section */}
        <section className="mb-12">
          <h2 className="text-amber-400 text-2xl mb-6 border-b border-amber-600 pb-2">Game Characters</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Cultivators/Towers */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3">
                <div style={{ fontSize: '24px', lineHeight: '24px' }}>⚔️</div>
              </div>
              <div className="text-amber-300 text-sm">Sword Cultivator</div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3">
                <div style={{ fontSize: '24px', lineHeight: '24px' }}>🫱</div>
              </div>
              <div className="text-amber-300 text-sm">Palm Cultivator</div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3">
                <div style={{ fontSize: '24px', lineHeight: '24px' }}>🏹</div>
              </div>
              <div className="text-amber-300 text-sm">Arrow Cultivator</div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3">
                <div style={{ fontSize: '24px', lineHeight: '24px' }}>⚡</div>
              </div>
              <div className="text-amber-300 text-sm">Lightning Cultivator</div>
            </div>

            {/* Enemies */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3">
                <div className="text-3xl">👹</div>
              </div>
              <div className="text-red-300 text-sm">Demon Enemy</div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3">
                <div className="text-3xl">👤</div>
              </div>
              <div className="text-red-300 text-sm">Shadow Enemy</div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3">
                <div className="text-3xl">🐺</div>
              </div>
              <div className="text-red-300 text-sm">Beast Enemy</div>
            </div>

            {/* Sacred Temple */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3">
                <div className="text-6xl">🏯</div>
              </div>
              <div className="text-amber-300 text-sm">Sacred Temple</div>
            </div>
          </div>
        </section>

        {/* Projectiles Section */}
        <section className="mb-12">
          <h2 className="text-amber-400 text-2xl mb-6 border-b border-amber-600 pb-2">Projectiles</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3">
                <div className="text-2xl animate-pulse">⚔</div>
              </div>
              <div className="text-amber-300 text-sm">Sword Projectile</div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3">
                <div className="text-2xl animate-pulse">💨</div>
              </div>
              <div className="text-amber-300 text-sm">Palm Projectile</div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3">
                <div className="text-2xl animate-pulse">🏹</div>
              </div>
              <div className="text-amber-300 text-sm">Arrow Projectile</div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3">
                <div className="text-2xl animate-pulse">⚡</div>
              </div>
              <div className="text-amber-300 text-sm">Lightning Projectile</div>
            </div>
          </div>
        </section>

        {/* UI Components Section */}
        <section className="mb-12">
          <h2 className="text-amber-400 text-2xl mb-6 border-b border-amber-600 pb-2">UI Components</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Stats Display */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3">
                <div className="flex gap-2 justify-center">
                  <div className="bg-black/30 rounded px-3 py-2">
                    <span className="text-blue-400">⚡100</span>
                  </div>
                  <div className="bg-black/30 rounded px-3 py-2">
                    <span className="text-purple-400">🌊5</span>
                  </div>
                  <div className="bg-black/30 rounded px-3 py-2">
                    <span className="text-green-400">⭐250</span>
                  </div>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Stats Display (Qi/Wave/Score)</div>
            </div>

            {/* Health Bar - Full */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="w-10 h-1 bg-red-900 rounded">
                  <div className="h-full bg-green-500 rounded" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Health Bar (Full)</div>
            </div>

            {/* Health Bar - Half */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="w-10 h-1 bg-red-900 rounded">
                  <div className="h-full bg-green-500 rounded" style={{ width: '50%' }}></div>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Health Bar (Half)</div>
            </div>

            {/* Health Bar - Low */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="w-10 h-1 bg-red-900 rounded">
                  <div className="h-full bg-red-500 rounded" style={{ width: '20%' }}></div>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Health Bar (Low/Enemy)</div>
            </div>

            {/* Range Indicator - Valid */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400/60 bg-amber-400/20 w-20 h-20"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">⚔️</div>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Range Indicator (Hover)</div>
            </div>

            {/* Range Indicator - Base */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="relative w-24 h-24">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/40 w-20 h-20"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">⚔️</div>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Range Indicator (Base)</div>
            </div>

            {/* Valid Placement Tile */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="w-16 h-16 bg-green-500/30 border-2 border-green-400 flex items-center justify-center">
                  <div className="text-2xl">⚔️</div>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Valid Placement Tile</div>
            </div>

            {/* Invalid Placement Tile */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="w-16 h-16 bg-red-500/30 border-2 border-red-400 flex items-center justify-center">
                  <div className="text-2xl opacity-50">⚔️</div>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Invalid Placement Tile</div>
            </div>

            {/* Validity Indicator - Valid */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="bg-green-900/80 text-green-300 border border-green-500 text-xs px-2 py-1 rounded">
                  ✓ Valid
                </div>
              </div>
              <div className="text-amber-300 text-sm">Validity Indicator (Valid)</div>
            </div>

            {/* Validity Indicator - Invalid */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="bg-red-900/80 text-red-300 border border-red-500 text-xs px-2 py-1 rounded">
                  ✗ Invalid
                </div>
              </div>
              <div className="text-amber-300 text-sm">Validity Indicator (Invalid)</div>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="mb-12">
          <h2 className="text-amber-400 text-2xl mb-6 border-b border-amber-600 pb-2">Buttons & Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Menu Button */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <Button variant="outline" size="sm" className="border-amber-600 text-amber-300 hover:bg-amber-900/50">
                  <Menu className="size-4" />
                </Button>
              </div>
              <div className="text-amber-300 text-sm">Menu Button</div>
            </div>

            {/* Mute Button - Unmuted */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <Button variant="outline" size="sm" className="border-amber-600 text-amber-300 hover:bg-amber-900/50 h-8 w-8 px-0">
                  <Volume2 className="size-4" />
                </Button>
              </div>
              <div className="text-amber-300 text-sm">Mute Button (Unmuted)</div>
            </div>

            {/* Mute Button - Muted */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <Button size="sm" className="bg-red-700 hover:bg-red-600 h-8 w-8 px-0">
                  <VolumeX className="size-4" />
                </Button>
              </div>
              <div className="text-amber-300 text-sm">Mute Button (Muted)</div>
            </div>

            {/* Pause Button */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <Button variant="outline" size="sm" className="border-amber-600 text-amber-300 hover:bg-amber-900/50 h-6 px-2 text-xs">
                  ⏸️
                </Button>
              </div>
              <div className="text-amber-300 text-sm">Pause Button</div>
            </div>

            {/* Resume Button */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <Button size="sm" className="bg-yellow-700 hover:bg-yellow-600 h-6 px-2 text-xs">
                  ▶️
                </Button>
              </div>
              <div className="text-amber-300 text-sm">Resume Button</div>
            </div>

            {/* Speed Buttons */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="flex gap-1 items-center bg-black/30 rounded px-2 py-1">
                  <Button size="sm" className="bg-amber-700 hover:bg-amber-600 h-6 w-8 px-0 text-xs">
                    1x
                  </Button>
                  <Button variant="outline" size="sm" className="border-amber-600 text-amber-300 hover:bg-amber-900/50 h-6 w-8 px-0 text-xs">
                    2x
                  </Button>
                  <Button variant="outline" size="sm" className="border-amber-600 text-amber-300 hover:bg-amber-900/50 h-6 w-8 px-0 text-xs">
                    3x
                  </Button>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Speed Controls</div>
            </div>

            {/* Start Button */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <Button size="sm" className="bg-green-700 hover:bg-green-600 h-7 text-xs">
                  Start
                </Button>
              </div>
              <div className="text-amber-300 text-sm">Start Button</div>
            </div>

            {/* Try Again Button */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <Button className="bg-amber-700 hover:bg-amber-600 text-white h-7 px-4 text-xs">
                  Try Again
                </Button>
              </div>
              <div className="text-amber-300 text-sm">Try Again Button</div>
            </div>

            {/* Countdown Timer */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <svg className="absolute" width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(251, 191, 36, 0.2)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(251, 191, 36)" strokeWidth="3" strokeDasharray="94.25" strokeDashoffset="47.12" strokeLinecap="round" />
                  </svg>
                  <span className="text-amber-300 text-xs z-10">15</span>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Countdown Timer (30s)</div>
            </div>

            {/* Skip Button */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <button className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-amber-500/20 cursor-pointer">
                  <svg className="absolute" width="36" height="36" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(251, 191, 36, 0.2)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(251, 191, 36)" strokeWidth="3" strokeDasharray="94.25" strokeDashoffset="23.56" strokeLinecap="round" />
                  </svg>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-amber-300 z-10">
                    <polygon points="5 3 5 21 19 12"></polygon>
                    <rect x="20" y="3" width="2" height="18"></rect>
                  </svg>
                </button>
              </div>
              <div className="text-amber-300 text-sm">Skip Button (≤25s)</div>
            </div>
          </div>
        </section>

        {/* Tower Selection Cards */}
        <section className="mb-12">
          <h2 className="text-amber-400 text-2xl mb-6 border-b border-amber-600 pb-2">Tower Selection Cards</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Unselected, Can Afford */}
            <div className="text-center">
              <button className="relative p-3 rounded border-2 bg-amber-900/50 border-amber-700 hover:bg-amber-800/50 w-full mb-3">
                <div className="flex items-center justify-center mb-1" style={{ fontSize: '24px' }}>⚔️</div>
                <div className="text-amber-100 text-xs leading-tight mb-1">Sword</div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-amber-300">⚡30</span>
                  <span className="text-red-300">💥20</span>
                </div>
              </button>
              <div className="text-amber-300 text-sm">Tower Card (Available)</div>
            </div>

            {/* Selected */}
            <div className="text-center">
              <button className="relative p-3 rounded border-2 bg-amber-600 border-amber-400 shadow-lg w-full mb-3">
                <div className="flex items-center justify-center mb-1" style={{ fontSize: '24px' }}>🫱</div>
                <div className="text-amber-100 text-xs leading-tight mb-1">Palm</div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-amber-300">⚡40</span>
                  <span className="text-red-300">💥15</span>
                </div>
                <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full leading-none">
                  ✓
                </div>
              </button>
              <div className="text-amber-300 text-sm">Tower Card (Selected)</div>
            </div>

            {/* Cannot Afford */}
            <div className="text-center">
              <button disabled className="relative p-3 rounded border-2 bg-gray-800/30 border-gray-700 opacity-50 cursor-not-allowed w-full mb-3">
                <div className="flex items-center justify-center mb-1" style={{ fontSize: '24px' }}>🏹</div>
                <div className="text-amber-100 text-xs leading-tight mb-1">Arrow</div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-amber-300">⚡50</span>
                  <span className="text-red-300">💥25</span>
                </div>
              </button>
              <div className="text-amber-300 text-sm">Tower Card (Cannot Afford)</div>
            </div>

            {/* Game Over State */}
            <div className="text-center">
              <div className="opacity-50 pointer-events-none">
                <button disabled className="relative p-3 rounded border-2 bg-amber-900/50 border-amber-700 w-full mb-3">
                  <div className="flex items-center justify-center mb-1" style={{ fontSize: '24px' }}>⚡</div>
                  <div className="text-amber-100 text-xs leading-tight mb-1">Lightning</div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-amber-300">⚡60</span>
                    <span className="text-red-300">💥30</span>
                  </div>
                </button>
              </div>
              <div className="text-amber-300 text-sm">Tower Card (Game Over)</div>
            </div>
          </div>
        </section>

        {/* Popups Section */}
        <section className="mb-12">
          <h2 className="text-amber-400 text-2xl mb-6 border-b border-amber-600 pb-2">Popups & Overlays</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Game Over Popup */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center min-h-[250px]">
                <div className="bg-gradient-to-br from-red-950 to-amber-950 border-4 border-red-600 rounded-lg p-8 text-center shadow-2xl">
                  <div className="text-5xl mb-3">⚔️</div>
                  <div className="text-red-400 text-2xl mb-3">Temple Destroyed!</div>
                  <div className="text-amber-300 text-sm">The demons have breached your defenses</div>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Game Over Popup</div>
            </div>

            {/* Menu Popup */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center min-h-[250px]">
                <div className="bg-gradient-to-br from-green-950 to-amber-950 border-4 border-amber-600 rounded-lg p-8 text-center shadow-2xl min-w-[200px]">
                  <div className="text-4xl mb-3">⚙️</div>
                  <div className="text-amber-300 text-xl mb-4">Game Paused</div>
                  <div className="flex flex-col gap-2">
                    <Button className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 w-full text-xs">
                      Resume Game
                    </Button>
                    <Button variant="outline" className="border-red-600 text-red-300 hover:bg-red-900/50 px-4 py-2 w-full text-xs">
                      Restart Game
                    </Button>
                    <Button variant="outline" className="border-amber-600 text-amber-300 hover:bg-amber-900/50 px-4 py-2 w-full text-xs">
                      Settings
                    </Button>
                  </div>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Menu Popup</div>
            </div>
          </div>
        </section>

        {/* Effects Section */}
        <section className="mb-12">
          <h2 className="text-amber-400 text-2xl mb-6 border-b border-amber-600 pb-2">Visual Effects</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Damage Flash - Enemy */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="text-6xl brightness-[300%] scale-125">👹</div>
              </div>
              <div className="text-amber-300 text-sm">Damage Flash Effect (Enemy)</div>
            </div>

            {/* Damage Flash - Tower */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="text-6xl brightness-[300%] scale-125">⚔️</div>
              </div>
              <div className="text-amber-300 text-sm">Damage Flash Effect (Tower)</div>
            </div>

            {/* Attack Effect */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="relative">
                  <div className="text-6xl">🏯</div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-4xl animate-ping">💥</div>
                  </div>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Attack Effect (Castle)</div>
            </div>
          </div>
        </section>

        {/* Helper Text Section */}
        <section className="mb-12">
          <h2 className="text-amber-400 text-2xl mb-6 border-b border-amber-600 pb-2">Helper Text & Tooltips</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Placement Instruction */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="text-amber-300 text-xs bg-black/70 px-3 py-2 rounded border border-amber-600">
                  <div>🎯 Place tower in highlighted zone (8 bottommost rows)</div>
                  <div className="text-amber-400 mt-1">Right-click to cancel</div>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Placement Instruction</div>
            </div>

            {/* Hover Hint */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="bg-black/80 text-amber-300 text-xs px-2 py-1 rounded">
                  Click for details
                </div>
              </div>
              <div className="text-amber-300 text-sm">Hover Hint (Tower)</div>
            </div>

            {/* Paused Indicator */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="bg-black/30 rounded px-2 py-1">
                  <span className="text-yellow-400 text-xs">Paused</span>
                </div>
              </div>
              <div className="text-amber-300 text-sm">Paused Indicator</div>
            </div>

            {/* Grid Zone Highlight */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <div className="w-32 h-16 bg-[rgba(251,191,36,0.05)] border-t-2 border-dashed border-[rgba(251,191,36,0.3)]"></div>
              </div>
              <div className="text-amber-300 text-sm">Tower Zone Highlight</div>
            </div>
          </div>
        </section>

        {/* Grid Elements */}
        <section className="mb-12">
          <h2 className="text-amber-400 text-2xl mb-6 border-b border-amber-600 pb-2">Grid Elements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Grid Pattern */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <defs>
                    <pattern id="showcase-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(251, 191, 36, 0.1)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="120" height="120" fill="url(#showcase-grid)" />
                  <rect x="0" y="0" width="120" height="120" fill="none" stroke="rgba(251, 191, 36, 0.1)" strokeWidth="1" />
                </svg>
              </div>
              <div className="text-amber-300 text-sm">Grid Pattern (30px cells)</div>
            </div>

            {/* Grid with Tower Zone */}
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-amber-600 mb-3 flex items-center justify-center">
                <svg width="120" height="160" viewBox="0 0 120 160">
                  <defs>
                    <pattern id="showcase-grid-zone" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(251, 191, 36, 0.1)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="120" height="160" fill="url(#showcase-grid-zone)" />
                  <rect x="0" y="96" width="120" height="64" fill="rgba(251, 191, 36, 0.05)" />
                  <line x1="0" y1="96" x2="120" y2="96" stroke="rgba(251, 191, 36, 0.3)" strokeWidth="2" strokeDasharray="10,5" />
                </svg>
              </div>
              <div className="text-amber-300 text-sm">Grid with Tower Zone Highlight</div>
            </div>
          </div>
        </section>

        {/* Background Colors */}
        <section className="mb-12">
          <h2 className="text-amber-400 text-2xl mb-6 border-b border-amber-600 pb-2">Color Schemes</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-900 to-green-800 p-6 rounded-lg border-2 border-amber-600 mb-3 h-24"></div>
              <div className="text-amber-300 text-sm">Header Background</div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border-2 border-amber-600 mb-3 h-24"></div>
              <div className="text-amber-300 text-sm">Game Board Background</div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-lg border-2 border-amber-600 mb-3 h-24"></div>
              <div className="text-amber-300 text-sm">App Background</div>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-red-950 to-amber-950 p-6 rounded-lg border-4 border-red-600 mb-3 h-24"></div>
              <div className="text-amber-300 text-sm">Game Over Popup</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}