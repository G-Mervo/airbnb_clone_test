import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';

interface ModalVisibilityHook {
  visible: boolean;
  shouldRender: boolean;
}

const useModalVisibility = (isOpen: boolean): ModalVisibilityHook => {
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setVisible(true), 30);
    } else {
      setVisible(false);
      setTimeout(() => setShouldRender(false), 200);
    }
  }, [isOpen]);

  return { visible, shouldRender };
};

const useBodyOverflow = (isOpen: boolean): void => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
};

interface CloseButtonProps {
  onClose: () => void;
}

const CloseButton: React.FC<CloseButtonProps> = ({ onClose }) => (
  <button
    onClick={onClose}
    className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full"
    aria-label="Close modal"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      aria-hidden="true"
      role="presentation"
      focusable="false"
      style={{
        display: 'block',
        fill: 'none',
        height: '16px',
        width: '16px',
        stroke: 'currentcolor',
        strokeWidth: 3,
        overflow: 'visible',
      }}
    >
      <path d="m6 6 20 20M26 6 6 26"></path>
    </svg>
  </button>
);

export interface Amenity {
  label: string;
  iconSrc: string;
  isAvailable: boolean;
}

interface AmenitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  amenities: Amenity[];
}

const amenityCategories: Record<string, string[]> = {
  Bathroom: ['Washer', 'Dryer', 'Hair dryer', 'Hot water'],
  'Bedroom and laundry': ['Essentials', 'Hangers', 'Iron'],
  Entertainment: ['TV', 'King bed'],
  'Heating and cooling': ['Air conditioning', 'Heating', 'Indoor fireplace'],
  'Home safety': ['Smoke alarm', 'Carbon monoxide alarm'],
  'Internet and office': ['Wifi', 'Dedicated workspace'],
  'Kitchen and dining': ['Kitchen', 'Breakfast'],
  'Location features': ['Waterfront', 'Beach access', 'Ski-in/ski-out'],
  Outdoor: ['Pool', 'Hot tub', 'Private hot tub', 'BBQ grill'],
  'Parking and facilities': ['Free parking', 'Gym', 'EV charger'],
  Services: ['Self check-in', 'Pets allowed', 'Allows pets', 'Instant book', 'Smoking allowed'],
};

const normalizeLabel = (label: string): string => {
  const lower = label.toLowerCase().trim();
  if (lower.includes('parking')) return 'Free parking';
  if (lower.includes('self')) return 'Self check-in';
  if (lower.includes('pet')) return 'Pets allowed';
  if (lower === 'tv') return 'TV';
  if (lower === 'washer') return 'Washer';
  if (lower === 'dryer') return 'Dryer';
  if (lower === 'kitchen') return 'Kitchen';
  if (lower === 'wifi') return 'Wifi';
  if (lower === 'air conditioning') return 'Air conditioning';
  if (lower === 'pool') return 'Pool';
  return label;
};

const AmenitiesModal: React.FC<AmenitiesModalProps> = ({ isOpen, onClose, amenities }) => {
  const { visible, shouldRender } = useModalVisibility(isOpen);
  useBodyOverflow(isOpen);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const { groupedAvailable, notIncluded } = useMemo(() => {
    const available: Amenity[] = [];
    const unavailable: Amenity[] = [];
    amenities.forEach((amenity) => {
      if (amenity.isAvailable) available.push(amenity);
      else unavailable.push(amenity);
    });

    const grouped: { category: string; items: Amenity[] }[] = [];
    const availableLabels = new Set(available.map((a) => normalizeLabel(a.label)));

    Object.entries(amenityCategories).forEach(([category, labels]) => {
      const itemsInCategory = available.filter((amenity) =>
        labels.some((catLabel) => normalizeLabel(amenity.label) === normalizeLabel(catLabel)),
      );
      if (itemsInCategory.length > 0) {
        grouped.push({ category, items: itemsInCategory });
        itemsInCategory.forEach((item) => availableLabels.delete(normalizeLabel(item.label)));
      }
    });

    const uncategorized = available.filter((a) => availableLabels.has(normalizeLabel(a.label)));
    if (uncategorized.length > 0) {
      grouped.push({ category: 'Miscellaneous', items: uncategorized });
    }

    return { groupedAvailable: grouped, notIncluded: unavailable };
  }, [amenities]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!shouldRender) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999999] p-4"
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-white ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } transition-transform duration-200 ease-in-out rounded-xl shadow-lg w-full max-w-[750px] max-h-[90vh] flex flex-col overflow-hidden`}
      >
        <div className="p-4 bg-white sticky top-0 z-10">
          <CloseButton onClose={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          <h2 className="text-3xl font-semibold mb-8">What this place offers</h2>

          <div className="space-y-6">
            {groupedAvailable.map(({ category, items }, index) => (
              <div key={category}>
                <h3 className="text-xl font-medium mb-4">{category}</h3>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.label} className="flex items-center gap-4">
                      <img src={item.iconSrc} alt="" className="w-6 h-6" />
                      <span className="text-base text-gray-800">{item.label}</span>
                    </div>
                  ))}
                </div>
                {index < groupedAvailable.length - 1 && <hr className="mt-6 border-gray-200" />}
              </div>
            ))}

            {notIncluded.length > 0 && (
              <div>
                <hr className="my-6 border-gray-200" />
                <h3 className="text-xl font-medium mb-4">Not included</h3>
                <div className="space-y-4">
                  {notIncluded.map((item) => (
                    <div key={item.label} className="flex items-center gap-4">
                      <img src={item.iconSrc} alt="" className="w-6 h-6" />
                      <span className="text-base text-gray-500 line-through">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AmenitiesModal;
