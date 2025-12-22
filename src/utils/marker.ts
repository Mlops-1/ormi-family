export const createPinMarker = (
  color: string,
  isActive: boolean,
  zIndex: number = 10,
  label?: string
) => {
  const scale = isActive ? 1.2 : 1.0;
  const labelHtml = label
    ? `<div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); background: ${color}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: ${
        zIndex + 1
      };">${label}</div>`
    : '';

  return `
    <div style="position: absolute; transform: translate(-50%, -100%); width: 24px; height: 30px; z-index: ${zIndex}; pointer-events: none;">
      ${labelHtml}
      <svg width="24" height="30" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg" style="transform: scale(${scale}); filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.3)); pointer-events: auto; cursor: pointer;">
        <path d="M12 0C5.37258 0 0 5.37258 0 12C0 20 12 30 12 30C12 30 24 20 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    </div>
  `;
};

export const createCurrentLocationMarker = (color: string) => {
  return `
    <div style="position: absolute; transform: translate(-50%, -50%); width: 40px; height: 40px; z-index: 200; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div style="position: absolute; top: -14px; background: ${color}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 300;">내 위치</div>
      <div style="width: 20px; height: 20px; background: white; border-radius: 50%; border: 3px solid ${color}; box-shadow: 0 0 15px ${color}, 0 0 5px ${color}; animation: pulse 2s infinite;"></div>
      <style>
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 ${color}80; }
          70% { box-shadow: 0 0 0 15px ${color}00; }
          100% { box-shadow: 0 0 0 0 ${color}00; }
        }
      </style>
    </div>
  `;
};

export const createReferenceMarker = (isPet: boolean, color: string) => {
  // SVG for Stroller or Dog Walker
  const icon = isPet
    ? `<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM20 11C20 11.6 19.6 12 19 12H15L14 16L17 21H15L13.2 17.5L12 19V22H10V18.1L12.3 14.8L13.1 11.5L11 11.8C10.5 11.9 10 11.5 10 11V10.1L6.7 8.3C6.3 8.1 6.1 7.6 6.3 7.2L7 5.5L8.9 6.2L8.5 7.1L10.3 8.1L14.4 7.5C15.3 7.4 16.2 7.7 16.8 8.4L18.7 10.7C19 11 19.6 11 20 11ZM5 22V20H7V22H5ZM5 19C4.4 19 4 18.6 4 18V13C4 12.4 4.4 12 5 12H8C8.6 12 9 12.4 9 13V18C9 18.6 8.6 19 8 19H5Z" fill="white"/>`
    : `<path d="M19 16C17.3 16 16 17.3 16 19C16 20.7 17.3 22 19 22C20.7 22 22 20.7 22 19C22 17.3 20.7 16 19 16ZM19 20C18.4 20 18 19.6 18 19C18 18.4 18.4 18 19 18C19.6 18 20 18.4 20 19C20 19.6 19.6 20 19 20ZM7 16C5.3 16 4 17.3 4 19C4 20.7 5.3 22 7 22C8.7 22 10 20.7 10 19C10 17.3 8.7 16 7 16ZM7 20C6.4 20 6 19.6 6 19C6 18.4 6.4 18 7 18C7.6 18 8 18.4 8 19C8 19.6 7.6 20 7 20ZM18.7 8.5L17.3 7.1L15.4 9L11.5 5.1C11.1 4.7 10.5 4.7 10.1 5.1L4.1 11.1C3.7 11.5 3.7 12.1 4.1 12.5L5.5 13.9L4 15.4V16H20V15.4L18.7 8.5ZM13.1 9.6L16.2 12.7L15 13.9L11.9 10.8L13.1 9.6Z" fill="white"/>`;

  return `
    <div style="position: absolute; transform: translate(-50%, -100%); width: 40px; height: 50px; z-index: 300; pointer-events: none; display: flex; flex-direction: column; align-items: center;">
      <div style="width: 40px; height: 40px; border-radius: 50%; background: ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.3); border: 2px solid white;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${icon}
        </svg>
      </div>
      <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-top: 10px solid ${color}; margin-top: -1px;"></div>
    </div>
  `;
};

export const createSpotMarker = (
  imageUrl: string,
  isActive: boolean,
  theme: 'orange' | 'green' = 'orange'
) => {
  const sizeValue = isActive ? 60 : 48;
  const size = `${sizeValue}px`;
  const zIndex = isActive ? 100 : 20;

  const activeColor = theme === 'green' ? '#10B981' : '#FFA500'; // Changed from #FF5000 to match dashboard orange
  const border = isActive ? `3px solid ${activeColor}` : '2px solid white';
  const arrowColor = isActive ? activeColor : 'white';

  const pulseLoop = isActive
    ? `
    <div style="position: absolute; inset: -6px; border-radius: 50%; border: 3px solid ${activeColor}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; pointer-events: none; opacity: 0.6;">
    </div>
  `
    : '';

  return `
    <div style="position: absolute; transform: translate(-50%, -100%); width: ${sizeValue}px; height: ${sizeValue + 8}px; z-index: ${zIndex}; pointer-events: none;">
      <div style="position: relative; width: ${size}; height: ${size}; cursor: pointer; transform-origin: bottom center;" class="group pointer-events-auto">
        ${pulseLoop}
        <div class="absolute inset-0 rounded-full shadow-lg overflow-hidden transition-transform duration-200 group-hover:scale-110" style="background-color: white; border: ${border};">
          <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/no_image.png'"/>
        </div>
        <div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${arrowColor}; filter: drop-shadow(0 2px 1px rgba(0,0,0,0.2));"></div>
      </div>
    </div>
  `;
};
