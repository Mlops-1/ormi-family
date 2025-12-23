import type { Coordinates } from '@/types/geo';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import LocationPicker from './LocationPicker';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (coords: Coordinates, address: string) => void;
  initialCoordinates: Coordinates;
  title?: string;
  confirmLabel?: string;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  onConfirm,
  initialCoordinates,
  title = '위치 설정',
  confirmLabel = '이 위치로 설정',
}: LocationPickerModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 relative">
        <div className="p-4 flex justify-between items-center bg-gray-50 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        <div className="p-0">
          <LocationPicker
            initialCoordinates={initialCoordinates}
            onConfirm={(coords, address) => {
              onConfirm(coords, address);
              onClose();
            }}
            confirmLabel={confirmLabel}
            height="400px"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
