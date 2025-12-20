import { BARRIER_CONFIG, CATEGORY_CONFIG } from '@/constants/filterConfig';
import { useFilterStore } from '@/store/filterStore';
import { useMapStore } from '@/store/mapStore';

export default function SideNavigation() {
  const {
    categoryOrderedIds,
    barrierOrderedIds,
    selectedCategoryIds,
    selectedBarrierIds,
    setSelectedCategoryIds,
    setSelectedBarrierIds,
  } = useFilterStore();

  // We can also check isMapMode here if we want to potentially hide/show it,
  // but the parent usually controls conditional rendering.
  // The user said: "logic to show/hide is broken".
  // Let's use mapStore-driven visibility if needed, or stick to the requirement:
  // "Hide in Routing Mode".
  // We can read isRouting logic from mapStore.

  const { startPoint, endPoint, wayPoints } = useMapStore();
  const isRoutingMode = !!(startPoint || endPoint || wayPoints.length > 0);

  if (isRoutingMode) return null;

  return (
    <>
      {/* Left Side: Category Config */}
      <div className="absolute top-28 left-0 z-40 flex flex-col gap-3 pointer-events-auto">
        {categoryOrderedIds.map((id) => {
          const config = CATEGORY_CONFIG[id];
          const isActive = selectedCategoryIds.includes(id);
          return (
            <button
              key={id}
              onClick={() =>
                setSelectedCategoryIds(
                  isActive
                    ? selectedCategoryIds.filter((cid) => cid !== id)
                    : [...selectedCategoryIds, id]
                )
              }
              className={`flex items-center gap-2 pl-4 pr-3 py-3 rounded-r-2xl shadow-md transition-all duration-300 ${
                isActive
                  ? 'bg-orange-500 dark:bg-ormi-green-600 text-white translate-x-0'
                  : 'bg-white text-gray-400 -translate-x-1 hover:translate-x-0'
              }`}
            >
              <span className="shrink-0">{config.icon}</span>
              <span className="font-bold text-sm hidden md:block whitespace-nowrap">
                {config.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Side: Barrier Config */}
      <div className="absolute top-28 right-0 z-40 flex flex-col gap-3 pointer-events-auto">
        {barrierOrderedIds.map((id) => {
          const config = BARRIER_CONFIG[id];
          const isActive = selectedBarrierIds.includes(id);
          return (
            <button
              key={id}
              onClick={() =>
                setSelectedBarrierIds(
                  isActive
                    ? selectedBarrierIds.filter((bid) => bid !== id)
                    : [...selectedBarrierIds, id]
                )
              }
              className={`flex items-center gap-2 pr-4 pl-3 py-3 rounded-l-2xl shadow-md transition-all duration-300 ${
                isActive
                  ? 'bg-orange-500 dark:bg-ormi-green-600 text-white translate-x-0'
                  : 'bg-white text-gray-400 translate-x-1 hover:translate-x-0'
              }`}
            >
              <span className="shrink-0">{config.icon}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
