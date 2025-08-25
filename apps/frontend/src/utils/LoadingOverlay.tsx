import React from 'react';

type LoadingOverlayProps = {
  show: boolean;
  message?: string;
  overlayClassName?: string;
  spinnerClassName?: string;
  blockPointerEvents?: boolean; // if true, overlay blocks clicks; otherwise lets them pass through
};

// Container-scoped loading overlay. Parent should have position: relative.
const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  message = 'Updating results…',
  overlayClassName = '',
  spinnerClassName = '',
  blockPointerEvents = false,
}) => {
  return (
    <div
      className={
        `absolute inset-0 transition-opacity duration-200 ease-out ` +
        `${show ? 'opacity-100' : 'opacity-0 pointer-events-none'} ` +
        `${blockPointerEvents ? '' : 'pointer-events-none'} ` +
        `${overlayClassName || 'bg-white/60 z-50'}`
      }
      role="status"
      aria-live="polite"
      aria-busy={show}
      aria-hidden={!show}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-sm text-gray-700">
          <span
            className={`inline-block rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin ${spinnerClassName}`}
            style={{ width: 14, height: 14 }}
            aria-hidden="true"
          />
          {message}
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
