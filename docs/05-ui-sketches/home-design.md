import React from 'react';

// --- MOCK DATA ---
const PRAYERS = [
  { id: 'fajr', name: 'Fajr', time: '4:12', ampm: 'AM', isNext: false },
  { id: 'dhuhr', name: 'Dhuhr', time: '12:01', ampm: 'PM', isNext: false },
  { id: 'asr', name: 'Asr', time: '3:34', ampm: 'PM', isNext: true, countdown: '1h 23m' },
  { id: 'maghrib', name: 'Maghrib', time: '6:48', ampm: 'PM', isNext: false },
  { id: 'isha', name: 'Isha', time: '8:10', ampm: 'PM', isNext: false },
];

const LOC = "Cairo";
const DATE = "12 Dhul-Hijjah 1447";

// --- ICONS (Inline SVGs for self-containment) ---
const MapPinIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const SettingsIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const CompassIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
  </svg>
);

// --- HARDWARE WRAPPER ---
// Simulates the physical watch bezel and ensures the strict 390x390 OLED canvas
const WatchHardware = ({ children, variation, description }) => {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[450px]">
      <h2 className="text-xl font-semibold tracking-wider text-zinc-300">VARIATION {variation}</h2>
      
      {/* Outer physical bezel */}
      <div className="relative w-[430px] h-[430px] rounded-full bg-gradient-to-br from-zinc-700 via-zinc-900 to-black p-[20px] shadow-2xl shadow-emerald-900/10 flex items-center justify-center shrink-0">
        
        {/* Inner 390x390 Screen */}
        <div 
          className="w-[390px] h-[390px] rounded-full bg-black overflow-hidden relative text-white flex flex-col font-sans"
          style={{ WebkitFontSmoothing: 'antialiased' }}
        >
          {children}
        </div>

        {/* Glare effect to simulate glass */}
        <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-transparent z-50"></div>
      </div>

      <p className="text-zinc-400 text-sm text-center max-w-[320px] leading-relaxed">
        {description}
      </p>
    </div>
  );
};

// --- VARIATION A: VERTICAL LIST ---
const VariationA = () => {
  return (
    <WatchHardware 
      variation="A" 
      description="Readability over density. Natural scrolling list, easy to read, but requires a swipe to see all items comfortably."
    >
      <div className="w-full h-full overflow-y-auto no-scrollbar" style={{ maskImage: 'linear-gradient(to bottom, transparent 2%, black 15%, black 85%, transparent 98%)' }}>
        <div className="flex flex-col items-center pt-10 pb-16 px-6 min-h-full">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-4">
            <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
              <MapPinIcon size={14} />
              <span className="text-sm font-medium">{LOC}</span>
            </div>
            <span className="text-xs text-zinc-400">{DATE}</span>
          </div>

          {/* Prayer List */}
          <div className="w-full flex flex-col gap-2 relative z-10">
            {PRAYERS.map((p) => (
              <div 
                key={p.id} 
                className={`flex items-center justify-between px-5 py-3.5 rounded-full ${p.isNext ? 'bg-emerald-500/20 ring-1 ring-emerald-500/50' : 'bg-zinc-900/40'}`}
              >
                <div className="flex flex-col">
                  <span className={`text-lg font-medium ${p.isNext ? 'text-emerald-400' : 'text-zinc-200'}`}>
                    {p.name}
                  </span>
                  {p.isNext && (
                    <span className="text-xs text-emerald-300">in {p.countdown}</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className={`text-xl font-light ${p.isNext ? 'text-white' : 'text-zinc-100'}`}>
                    {p.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-center gap-6 mt-6 pb-4">
            <button className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
              <CompassIcon />
            </button>
            <button className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
              <SettingsIcon />
            </button>
          </div>

        </div>
      </div>
    </WatchHardware>
  );
};

// --- VARIATION B: COMPACT TABLE ---
const VariationB = () => {
  return (
    <WatchHardware 
      variation="B" 
      description="Density over elegance. Fits everything cleanly without scrolling, but numbers are smaller and layout feels tighter."
    >
      <div className="w-full h-full flex flex-col items-center justify-center px-4 pt-4 relative">
        
        {/* Top Info */}
        <div className="flex flex-col items-center mb-3">
          <div className="flex items-center gap-1 text-emerald-400">
            <MapPinIcon size={12} />
            <span className="text-xs font-semibold tracking-wide uppercase">{LOC}</span>
          </div>
          <span className="text-[11px] text-zinc-400">{DATE}</span>
        </div>

        {/* Highlighted Next Prayer (Spans full width above grid) */}
        <div className="w-[85%] bg-emerald-500/15 border border-emerald-500/30 rounded-3xl p-3 flex flex-col items-center mb-3">
          <span className="text-emerald-400 font-medium text-sm mb-0.5">Asr in {PRAYERS[2].countdown}</span>
          <span className="text-4xl font-light text-white tracking-tight">{PRAYERS[2].time}</span>
        </div>

        {/* 2x2 Grid for remaining 4 prayers */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 w-[85%]">
          {PRAYERS.filter(p => !p.isNext).map((p) => (
            <div key={p.id} className="flex flex-col items-center bg-zinc-900/50 rounded-2xl py-2">
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{p.name}</span>
              <span className="text-xl font-light text-zinc-100">{p.time}</span>
            </div>
          ))}
        </div>

        {/* Curved Bottom Icons */}
        <div className="absolute bottom-4 flex justify-between w-32">
          <SettingsIcon size={18} className="text-zinc-500" />
          <CompassIcon size={18} className="text-zinc-500" />
        </div>

      </div>
    </WatchHardware>
  );
};

// --- VARIATION C: HERO LAYOUT ---
const VariationC = () => {
  return (
    <WatchHardware 
      variation="C" 
      description="Glanceability over equality. Massive focus on the next prayer, relegating others to a dense bottom arc."
    >
      <div className="w-full h-full flex flex-col items-center relative">
        
        {/* Hero Section (Top 60%) */}
        <div className="flex-1 flex flex-col items-center justify-center pt-8 w-full">
          <div className="flex items-center gap-1.5 text-zinc-400 mb-2">
            <MapPinIcon size={14} />
            <span className="text-sm">{LOC} • {DATE}</span>
          </div>
          
          <div className="flex flex-col items-center text-emerald-400 mt-2">
            <span className="text-2xl font-medium tracking-widest uppercase">Asr</span>
            <span className="text-7xl font-light text-white my-1 tracking-tighter">3:34</span>
            <div className="bg-emerald-500/20 text-emerald-300 px-4 py-1 rounded-full text-sm font-medium mt-2">
              - {PRAYERS[2].countdown}
            </div>
          </div>
        </div>

        {/* Bottom Small List (Bottom 40%) */}
        <div className="h-[140px] w-full bg-zinc-900/40 rounded-t-[195px] flex flex-col items-center pt-5 relative">
          <div className="flex justify-center gap-6 w-full px-8">
            {PRAYERS.filter(p => !p.isNext).map((p) => (
              <div key={p.id} className="flex flex-col items-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">{p.name.charAt(0)}</span>
                <span className="text-sm font-medium text-zinc-200">{p.time}</span>
              </div>
            ))}
          </div>

          <div className="absolute bottom-6 flex gap-12 text-zinc-500">
            <SettingsIcon size={18} />
            <CompassIcon size={18} />
          </div>
        </div>

      </div>
    </WatchHardware>
  );
};

// --- VARIATION D: RADIAL / RING ---
const VariationD = () => {
  // We place the 4 remaining prayers on an arc.
  // Center (195, 195). Radius ~ 140px for text.
  const radius = 135;
  const nonActivePrayers = PRAYERS.filter(p => !p.isNext);
  
  // Distribute along the top/side arc: -60, -20, 20, 60 degrees from top center (0)
  // Let's use standard angles. Top = -90deg in standard math.
  const angles = [-200, -160, -20, 20]; // Adjusting visually for a nice asymmetrical dial

  const getPosition = (angleDeg) => {
    const rad = angleDeg * (Math.PI / 180);
    return {
      x: 195 + radius * Math.cos(rad) - 25, // -25 to center the 50px wide element
      y: 195 + radius * Math.sin(rad) - 20,
    };
  };

  return (
    <WatchHardware 
      variation="D" 
      description="Spatial awareness. Uses the hardware shape natively. Next prayer is central, others map around the dial."
    >
      <div className="w-full h-full relative flex items-center justify-center">
        
        {/* Ring Elements */}
        {nonActivePrayers.map((p, i) => {
          // Calculate even distribution along the edge
          const angle = -180 + (i * 45) + 22.5; // Starts left, goes over top to right
          const pos = getPosition(angle);
          
          return (
            <div 
              key={p.id} 
              className="absolute flex flex-col items-center w-[50px]"
              style={{ left: pos.x, top: pos.y }}
            >
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{p.name}</span>
              <span className="text-sm text-zinc-300 font-light">{p.time}</span>
            </div>
          );
        })}

        {/* Radial tracking line decoration */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 390 390">
          <circle cx="195" cy="195" r="165" fill="none" stroke="#27272a" strokeWidth="2" strokeDasharray="4 8" />
          <circle cx="195" cy="195" r="165" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="100 1000" strokeDashoffset="-280" />
        </svg>

        {/* Center Active Information */}
        <div className="relative z-10 flex flex-col items-center justify-center w-[200px] h-[200px] rounded-full bg-black/60 backdrop-blur-sm border border-zinc-800/50 shadow-2xl">
          <span className="text-emerald-400 font-medium tracking-widest uppercase text-sm mb-1">Asr</span>
          <span className="text-6xl font-light text-white tracking-tighter -ml-2">{PRAYERS[2].time}</span>
          <div className="text-emerald-300 font-medium mt-1">in {PRAYERS[2].countdown}</div>
        </div>

        {/* Bottom Details */}
        <div className="absolute bottom-8 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-zinc-400 mb-2">
            <MapPinIcon size={12} />
            <span className="text-[11px] uppercase tracking-widest">{LOC}</span>
          </div>
          <div className="flex gap-8 text-zinc-500 mt-1">
            <SettingsIcon size={16} />
            <CompassIcon size={16} />
          </div>
        </div>

      </div>
    </WatchHardware>
  );
};


// --- MAIN APP RENDERER ---
export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8 font-sans selection:bg-emerald-500/30">
      <div className="max-w-[1900px] mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-light tracking-tight text-zinc-100 mb-3">
            Smartwatch UI Variations
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            4 layout approaches for an Amazfit Bip 6 (390x390px OLED display). Safe areas are respected, corners are avoided, and the design relies on high contrast and a single Emerald Green accent.
          </p>
        </header>

        {/* The Grid of Variations */}
        <div className="flex flex-wrap justify-center gap-12 xl:gap-8">
          <VariationA />
          <VariationB />
          <VariationC />
          <VariationD />
        </div>
      </div>
      
      {/* Global reset for hidden scrollbars used in Variation A */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}