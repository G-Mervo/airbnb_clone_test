import React, {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createPortal } from 'react-dom';
import { setOpenName } from '../../redux/mainFormSlice';

type ModalContextValue = {
  openName: string;
  close: () => void;
  open: (name: string) => { type: string; payload: string };
  onlyOneTime?: React.MutableRefObject<boolean> | null | undefined;
};
export const modalContext = createContext<ModalContextValue | null>(null);

function Modal({
  children,
  onlyOneTime,
}: {
  children: React.ReactNode;
  onlyOneTime?: React.MutableRefObject<boolean> | null;
}) {
  const openName = useSelector((store: any) => store.form.openName);
  const dispatch = useDispatch();
  const close = () => {
    dispatch(setOpenName(''));
  };
  const open = setOpenName;

  return (
    <modalContext.Provider value={{ openName, close, open, onlyOneTime }}>
      {children}
    </modalContext.Provider>
  );
}

function Open({
  children,
  opens: opensWindowName,
}: {
  children: React.ReactElement;
  opens: string;
}) {
  const dispatch = useDispatch();

  return cloneElement(children, {
    onClick: () => {
      dispatch(setOpenName(opensWindowName));
    },
  });
}

function Window({
  children,
  name,
  modalRef,
  resetRef,
}: {
  children: React.ReactElement;
  name: string;
  modalRef: React.RefObject<HTMLDivElement>;
  resetRef?: React.RefObject<HTMLElement> | null;
}) {
  const context = useContext(modalContext);
  if (!context) return null;
  const {
    curSelectInput: selectedInput,
    isCalendarModalOpen: isModalOpen,
    dateOption,
  } = useSelector((store: any) => store.form);
  const { startScroll } = useSelector((store: any) => store.app);
  const { openName, close, onlyOneTime } = context;

  const ref = useRef<HTMLDivElement | null>(null);

  const [position, setPosition] = useState<null | {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    position: 'fixed';
    width?: string;
    height?: string;
    maxHeight?: string;
    paddingLeft?: string;
    paddingRight?: string;
  }>(null);
  const [isRendered, setIsRendered] = useState(false);

  const updatePosition = useCallback(() => {
    if (name !== openName) {
      setIsRendered(false);
      return;
    }

    const targetEl = document.getElementById('destination-form');
    const addGuestEl = document.getElementById('addGuest-form');
    let addGuestModal = openName === 'addGuest';

    let calendarModalWidth = ['checkIn', 'checkOut', 'month', 'flexible'].includes(openName);

    // Mobile behavior - full screen modal for small screens
    if (window.innerWidth <= 936) {
      setPosition({
        top: '0px',
        left: '0px',
        right: '0px',
        bottom: '0px',
        position: 'fixed',
        width: '100vw',
        height: '100vh',
      });
    } else {
      // Desktop behavior - fixed dropdown under search bar
      const relevantEl = addGuestModal ? addGuestEl : targetEl;
      if (relevantEl) {
        const rect = relevantEl.getBoundingClientRect();
        let addGuestPosition = addGuestModal ? 416 - rect.width : 0;

        // Calculate max height to prevent overflow
        const maxHeight = window.innerHeight - rect.bottom - 40; // 40px padding from bottom

        setPosition({
          top: `${rect.bottom + 16}px`, // Fixed pixel value instead of percentage
          left: `${rect.left - addGuestPosition}px`, // Fixed pixel value
          position: 'fixed',
          width: calendarModalWidth ? '880px' : '416px', // Wider for 2-month calendar
          maxHeight: `${Math.max(maxHeight, 400)}px`, // More height for calendar
          paddingLeft: 'auto',
          paddingRight: 'auto',
        });
      }
    }
    if (!onlyOneTime?.current) {
      setIsRendered(true);
    }
  }, [openName, onlyOneTime, name]);

  useEffect(() => {
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition]);

  useLayoutEffect(() => {
    let animationFrameId: number | null = null;

    const runUpdatePosition = () => {
      updatePosition();
      animationFrameId = requestAnimationFrame(runUpdatePosition);
    };

    if (name === openName) {
      runUpdatePosition();
    }

    setTimeout(() => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (onlyOneTime?.current) {
        onlyOneTime.current = false;
        setIsRendered(true);
      }
    }, 300);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [updatePosition, name, onlyOneTime, openName, startScroll]);

  let modalStyle: Record<string, string> = {
    checkIn: `fixed z-[10001] bg-transparent rounded-[2rem] shadow-2xl`,
    month: `fixed z-[10001] bg-transparent rounded-[2rem] shadow-2xl`,
    flexible: `fixed z-[10001] bg-transparent rounded-[2rem] shadow-2xl`,
    destination: `fixed z-[10001] bg-transparent rounded-[2rem] shadow-2xl`,
    checkOut: `fixed z-[10001] bg-transparent rounded-[2rem] shadow-2xl`,
    addGuest: `fixed z-[10001] bg-transparent rounded-[2rem] shadow-2xl`,
  };

  // Get mobile-specific styles
  const isMobile = window.innerWidth <= 936;
  const mobileModalStyle = isMobile ? 'w-full h-full rounded-none' : '';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      console.log('Modal: Click detected', {
        isModalOpen,
        target: e.target,
        modalName: name,
        openName,
      });

      // Don't close the original modal if calendar modal is open
      if (isModalOpen) {
        console.log('Modal: Calendar modal is open, not closing');
        return;
      }

      // Check if click target is within any calendar modal
      const calendarModal = document.querySelector('[data-modal="true"]');
      if (calendarModal && calendarModal.contains(e.target as Node)) {
        console.log('Modal: Click is inside calendar modal, not closing');
        return; // Don't close if clicking inside calendar modal
      }

      // Check if click is outside the modal
      if (
        ref?.current &&
        !ref.current?.contains(e.target as Node) &&
        (!resetRef?.current || !resetRef.current?.contains(e.target as Node))
      ) {
        console.log('Modal: Click is outside modal, closing');
        close();
      } else {
        console.log('Modal: Click is inside modal, not closing');
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [close, resetRef, isModalOpen]);

  if (name !== openName || !position || !isRendered) return null;

  return createPortal(
    <>
      {/* Mobile backdrop overlay */}
      {isMobile && <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000]" />}
      <div
        style={{
          ...position,
          opacity: isRendered ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
        className={`${modalStyle[selectedInput]} ${mobileModalStyle}`}
        id="formModal"
        ref={ref}
      >
        <div
          className={`bg-white shadow-modalShadow z-[10001] ${
            isMobile
              ? 'w-full h-full rounded-none flex flex-col'
              : 'rounded-[2rem] max-h-full overflow-hidden'
          }`}
          ref={modalRef}
        >
          {/* Mobile header with close button */}
          {isMobile && (
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">
                {selectedInput === 'destination' && 'Search destinations'}
                {selectedInput === 'checkIn' && 'Check in'}
                {selectedInput === 'checkOut' && 'Check out'}
                {selectedInput === 'addGuest' && 'Who'}
                {selectedInput === 'month' && 'When'}
                {selectedInput === 'flexible' && 'Flexible dates'}
              </h2>
              <button
                onClick={close}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Scrollable content */}
          <div
            className={`overflow-y-auto overflow-x-hidden ${isMobile ? 'flex-1' : 'max-h-[75vh]'}`}
            style={{
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db transparent',
            }}
          >
            <div className="flex flex-col min-h-full">
              <div className="flex-1">{cloneElement(children)}</div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

Modal.Open = Open;
Modal.Window = Window;

export default Modal;

export { Open, Window };
