import { fetchRoute } from '@/api/tmapRoute';
import { useRouteStore } from '@/store/routeStore';
import type { Coordinates } from '@/types/geo';
import type { RoutePoint } from '@/types/map';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for TMAP route calculation
 * Handles automatic route recalculation when route points change
 */
export function useRouteCalculation() {
  const {
    startPoint,
    endPoint,
    wayPoints,
    setRoutePath,
    setRouteSummary,
    setIsCalculating,
    setError,
    hasValidRoute,
  } = useRouteStore();

  // Use ref to track the latest calculation to prevent race conditions
  const calculationIdRef = useRef(0);

  const calculateRoute = useCallback(
    async (
      start: RoutePoint,
      end: RoutePoint,
      ways: RoutePoint[]
    ): Promise<void> => {
      const currentCalculationId = ++calculationIdRef.current;

      setIsCalculating(true);
      setError(null);

      try {
        // Filter out waypoints that are the same as start or end
        // This prevents the "straight line" issue
        const validWaypoints = ways.filter((w) => {
          const isSameAsStart =
            Math.abs(w.coordinates.lat - start.coordinates.lat) < 0.0001 &&
            Math.abs(w.coordinates.lon - start.coordinates.lon) < 0.0001;
          const isSameAsEnd =
            Math.abs(w.coordinates.lat - end.coordinates.lat) < 0.0001 &&
            Math.abs(w.coordinates.lon - end.coordinates.lon) < 0.0001;
          return !isSameAsStart && !isSameAsEnd;
        });

        // Format passList according to TMAP API specification
        // NOTE: TMap API's passList doesn't work well, so we calculate each segment separately

        console.log('🗺️ Calculating route with:', {
          start: `${start.name} (${start.coordinates.lat}, ${start.coordinates.lon})`,
          end: `${end.name} (${end.coordinates.lat}, ${end.coordinates.lon})`,
          waypoints: validWaypoints.map((w) => w.name),
        });

        // Build segments: start → wp1 → wp2 → ... → end
        const points = [
          start.coordinates,
          ...validWaypoints.map((w) => w.coordinates),
          end.coordinates,
        ];

        // Calculate each segment separately
        const allPaths: Coordinates[] = [];
        let totalDistance = 0;
        let totalTime = 0;

        for (let i = 0; i < points.length - 1; i++) {
          const segmentStart = points[i];
          const segmentEnd = points[i + 1];

          console.log(
            `📍 Calculating segment ${i + 1}/${points.length - 1}:`,
            segmentStart,
            '→',
            segmentEnd
          );

          const response = await fetchRoute({
            startX: segmentStart.lon,
            startY: segmentStart.lat,
            endX: segmentEnd.lon,
            endY: segmentEnd.lat,
          });

          // Extract path from response
          const segmentPath: Coordinates[] = [];
          response.features.forEach((feature) => {
            if (feature.geometry.type === 'LineString') {
              const coords = feature.geometry.coordinates as [number, number][];
              coords.forEach((c) => segmentPath.push({ lon: c[0], lat: c[1] }));
            }
          });

          // Add to total path (skip first point of subsequent segments to avoid duplicates)
          if (i === 0) {
            allPaths.push(...segmentPath);
          } else {
            allPaths.push(...segmentPath.slice(1));
          }

          // Add segment distance and time
          const props = response.features[0]?.properties;
          totalDistance += props?.totalDistance || 0;
          totalTime += props?.totalTime || 0;
        }

        // Check if this calculation is still relevant
        if (currentCalculationId !== calculationIdRef.current) {
          console.log('⚠️ Route calculation outdated, ignoring result');
          return;
        }

        const summary = {
          time: totalTime,
          distance: totalDistance,
        };

        console.log('✅ Route calculated successfully:', {
          pathPoints: allPaths.length,
          distance: summary.distance,
          time: summary.time,
          segments: points.length - 1,
        });

        setRoutePath(allPaths);
        setRouteSummary(summary);
        setIsCalculating(false);
      } catch (error) {
        // Check if this calculation is still relevant
        if (currentCalculationId !== calculationIdRef.current) {
          return;
        }

        console.error('❌ Route calculation error:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : '길찾기 경로를 계산할 수 없습니다.';

        setError(errorMessage);
        setRoutePath(null);
        setRouteSummary(null);
        setIsCalculating(false);
      }
    },
    [setRoutePath, setRouteSummary, setIsCalculating, setError]
  );

  // Auto-recalculate when route points change
  useEffect(() => {
    if (hasValidRoute()) {
      calculateRoute(startPoint!, endPoint!, wayPoints);
    } else {
      // Clear route if start or end is missing
      setRoutePath(null);
      setRouteSummary(null);
      setIsCalculating(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startPoint, endPoint, wayPoints, calculateRoute, hasValidRoute]);

  return {
    calculateRoute,
    isCalculating: useRouteStore((state) => state.isCalculating),
    error: useRouteStore((state) => state.error),
  };
}
