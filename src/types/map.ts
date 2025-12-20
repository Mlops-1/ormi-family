import type { Coordinates } from './geo';

export interface RoutePoint {
  id: string; // unique id
  type: 'start' | 'end' | 'waypoint';
  name: string;
  coordinates: Coordinates;
}
