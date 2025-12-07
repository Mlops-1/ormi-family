export {};

declare global {
  interface Window {
    Tmapv2: typeof Tmapv2;
  }

  namespace Tmapv2 {
    class Map {
      constructor(element: HTMLElement | string, options?: MapOptions);
      setCenter(center: LatLng): void;
      setZoom(zoom: number): void;
      addListener(eventType: string, callback: (evt: any) => void): void;
      destroy(): void;
    }

    interface MapOptions {
      center: LatLng;
      width: string;
      height: string;
      zoom?: number;
      zoomControl?: boolean;
      scrollwheel?: boolean;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(position: LatLng): void;
      getPosition(): LatLng;
      addListener(eventType: string, callback: (evt: any) => void): void;
    }

    interface MarkerOptions {
      position: LatLng;
      map?: Map;
      draggable?: boolean;
      icon?: string;
      title?: string;
    }

    // Simplistic event object for Tmap
    interface MapEvent {
      latLng: LatLng;
    }
  }
}
