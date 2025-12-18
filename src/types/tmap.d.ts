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
      addListener(eventType: string, callback: (evt: MapEvent) => void): void;
      destroy(): void;
      fitBounds(bounds: LatLngBounds): void;
      panTo(latlng: LatLng): void;
      setOptions(options: Partial<MapOptions>): void;
      setScrollwheel(enabled: boolean): void;
      setDraggable(enabled: boolean): void;
    }

    interface MapOptions {
      center: LatLng;
      width: string;
      height: string;
      zoom?: number;
      zoomControl?: boolean;
      scrollwheel?: boolean;
      draggable?: boolean;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      extend(latlng: LatLng): void;
    }

    class Marker {
      constructor(options?: MarkerOptions);
      setMap(map: Map | null): void;
      setPosition(position: LatLng): void;
      getPosition(): LatLng;
      addListener(eventType: string, callback: (evt: MapEvent) => void): void;
      setIconHTML(html: string): void;
      setZIndex(index: number): void; // Adding it to type def, but I'll be careful using it.
    }

    interface MarkerOptions {
      position: LatLng;
      map?: Map;
      draggable?: boolean;
      icon?: string;
      iconHTML?: string; // For custom HTML markers
      title?: string;
      label?: string; // HTML content or text for label
      offset?: Point;
      zIndex?: number;
    }

    class Point {
      constructor(x: number, y: number);
    }

    class Polyline {
      constructor(options?: PolylineOptions);
      setMap(map: Map | null): void;
      setPath(path: LatLng[]): void;
    }

    interface PolylineOptions {
      path: LatLng[];
      strokeColor?: string;
      strokeWeight?: number;
      strokeOpacity?: number;
      map?: Map;
    }

    // Simplistic event object for Tmap
    interface MapEvent {
      latLng: LatLng;
      [key: string]: unknown;
    }
  }
}
