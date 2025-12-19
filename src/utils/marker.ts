export const createOrangeMarker = (isActive: boolean) => {
  const color = isActive ? '#FF5000' : '#FF9500'; // Active: Red-Orange, Inactive: Orange
  const scale = isActive ? 1.2 : 1.0;
  const zIndex = isActive ? 50 : 10;

  // Added a large transparent rect (40x40) centered at 12,12 to increase hit area
  return `
    <svg width="40" height="40" viewBox="-8 -8 40 40" xmlns="http://www.w3.org/2000/svg" style="transform: scale(${scale}); filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.3)); z-index: ${zIndex}; cursor: pointer;">
      <rect x="-8" y="-8" width="40" height="40" fill="transparent" />
      <path d="M12 0C5.37258 0 0 5.37258 0 12C0 20 12 30 12 30C12 30 24 20 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `;
};

export const createGreenMarker = () => {
  // Green Marker for User Location
  return `
    <svg width="40" height="40" viewBox="-8 -8 40 40" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.3)); z-index: 100;">
      <circle cx="12" cy="12" r="10" fill="#22C55E" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="18" fill="#22C55E" fill-opacity="0.3" class="animate-pulse"/>
    </svg>
  `;
};

export const createSpotMarker = (
  imageUrl: string,
  isActive: boolean,
  theme: 'orange' | 'green' = 'orange'
) => {
  const size = isActive ? '60px' : '48px'; // Bigger when active
  const zIndex = isActive ? 50 : 20;

  const activeColor = theme === 'green' ? '#10B981' : '#FF5000';
  const border = isActive ? `3px solid ${activeColor}` : '2px solid white';
  const arrowColor = isActive ? activeColor : 'white';

  // Pulse ring animation for active state or hover
  // Always render but control opacity
  const pulseLoop = `
    <div class="${isActive ? 'opacity-60' : 'opacity-0 group-hover:opacity-60'} transition-opacity duration-300" 
         style="position: absolute; inset: -4px; border-radius: 50%; border: 2px solid ${activeColor}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none;">
    </div>
  `;

  return `
    <div style="position: relative; width: ${size}; height: ${size}; z-index: ${zIndex}; cursor: pointer; transform-origin: bottom center;" class="group">
      ${pulseLoop}
      <div class="absolute inset-0 rounded-full shadow-lg overflow-hidden transition-transform duration-200 group-hover:scale-110" style="background-color: white; border: ${border};">
        <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://via.placeholder.com/150?text=No+Image'"/>
      </div>
      <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${arrowColor}; filter: drop-shadow(0 2px 1px rgba(0,0,0,0.2));"></div>
    </div>
  `;
};
