import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import cross from '../../asset/Icons_svg/cross.svg';

const useModalVisibility = (isOpen: boolean) => {
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setVisible(true), 30);
    } else {
      setVisible(false);
      setTimeout(() => setShouldRender(false), 150);
    }
  }, [isOpen]);
  return { visible, shouldRender };
};
const useBodyOverflow = (isOpen: boolean) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
};

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fullDescription: string;
}

const DescriptionModal: React.FC<DescriptionModalProps> = ({
  isOpen,
  onClose,
  fullDescription,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { visible, shouldRender } = useModalVisibility(isOpen);
  useBodyOverflow(isOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const renderDescriptionSections = (text: string) => {
    const sections = text.split(/(The space|Guest access|Other things to note)/i);
    const elements = [];

    if (sections[0] && sections[0].trim()) {
      elements.push(
        <p key="intro" className="text-gray-800 font-normal leading-relaxed">
          {sections[0].trim()}
        </p>,
      );
    }

    for (let i = 1; i < sections.length; i += 2) {
      const title = sections[i];
      const content = sections[i + 1]?.trim().replace(/^[:\.]?\s*/, '');
      if (title && content) {
        elements.push(
          <div key={title} className="pt-6">
            <h4 className="font-semibold text-lg text-black mb-2">{title}</h4>
            <p className="text-gray-800 font-normal leading-relaxed whitespace-pre-line">
              {content}
            </p>
          </div>,
        );
      }
    }

    return <div className="space-y-4">{elements}</div>;
  };

  if (!shouldRender) return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-150 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="fixed inset-0 bg-black bg-opacity-60" onClick={onClose} />

      <div
        ref={ref}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl transform transition-transform duration-200 ease-out"
        style={{ transform: visible ? 'scale(1)' : 'scale(0.95)' }}
      >
        <div className="absolute top-0 left-0 pt-4 pl-4 z-10">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <img src={cross} alt="Close" className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[85vh] overflow-y-auto p-6 pt-16 lg:p-8 lg:pt-16">
          <h2 className="text-3xl font-bold text-black mb-6">About this space</h2>
          {renderDescriptionSections(fullDescription)}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DescriptionModal;
