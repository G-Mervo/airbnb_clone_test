import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import share from '../../asset/Icons_svg/shareIcon.svg';
import { svg } from '../../asset/HeartIconSvg';
import { useDispatch, useSelector } from 'react-redux';
import {
  removeUserFavListing,
  setIsFavorite,
  setItemId,
  setShowLogin,
  setUserFavListing,
} from '../../redux/AppSlice';

export interface ImageCategory {
  name: string;
  description?: string;
  images: string[];
}

interface HouseInfo {
  id: string;
  image_categories?: ImageCategory[];
  [key: string]: any;
}

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  houseInfo: HouseInfo | undefined;
}

const useShouldRender = (isOpen: boolean) => {
  const [shouldRender, setShouldRender] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    } else {
      const timer = setTimeout(() => setShouldRender(false), 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  return shouldRender;
};

// Custom hook for managing body overflow
const useBodyOverflow = (isOpen: boolean): void => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
};

const CloseButton: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <button
    onClick={onClose}
    className="w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className="w-4 h-4"
      style={{ stroke: 'currentcolor', strokeWidth: 4, fill: 'none' }}
    >
      <path d="M20 28 8.7 16.7a1 1 0 0 1 0-1.4L20 4"></path>
    </svg>
  </button>
);

const ActionButtons: React.FC<{ houseInfo: HouseInfo }> = ({ houseInfo }) => {
  const dispatch = useDispatch();
  const { userData, userFavListing } = useSelector((state: any) => state.app);
  const isFavorite = userFavListing?.includes(houseInfo.id);

  const handleFavoriteToggle = () => {
    if (!userData) dispatch(setShowLogin(true));
    else {
      if (isFavorite) {
        dispatch(removeUserFavListing(houseInfo.id));
        dispatch(setIsFavorite(false));
      } else {
        dispatch(setUserFavListing(houseInfo.id));
        dispatch(setIsFavorite(true));
      }
      dispatch(setItemId(houseInfo.id));
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button className="underline px-2 rounded-md h-8 hover:bg-shadow-gray-light text-sm font-medium justify-center hover:cursor-pointer gap-2 items-center flex">
        <img className="w-4 h-4" src={share} alt="Share" />
        <span>Share</span>
      </button>
      <button
        onClick={handleFavoriteToggle}
        className="underline px-2 rounded-md h-8 hover:bg-shadow-gray-light text-sm font-medium justify-center hover:cursor-pointer gap-2 items-center flex"
      >
        {svg(houseInfo.id, userFavListing, userData)}
        <span>Save</span>
      </button>
    </div>
  );
};

const ModalHeader: React.FC<{ onClose: () => void; houseInfo: HouseInfo }> = ({
  onClose,
  houseInfo,
}) => (
  <header className="sticky top-0 bg-white z-20 w-full h-16 flex items-center justify-between px-6 md:px-10">
    <CloseButton onClose={onClose} />
    <ActionButtons houseInfo={houseInfo} />
  </header>
);

const CategoryNav: React.FC<{
  categories: ImageCategory[];
  activeCategory: string;
  onSelect: (name: string) => void;
}> = ({ categories, activeCategory, onSelect }) => {
  const navRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeItemRef.current && navRef.current) {
      // Improved smooth scrolling for category navigation
      const activeButton = activeItemRef.current;
      const navContainer = navRef.current;

      // Calculate optimal scroll position to center the active item
      const containerWidth = navContainer.offsetWidth;
      const buttonLeft = activeButton.offsetLeft;
      const buttonWidth = activeButton.offsetWidth;

      const scrollLeft = buttonLeft - containerWidth / 2 + buttonWidth / 2;

      navContainer.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth',
      });
    }
  }, [activeCategory]);

  return (
    <div className="w-full px-6 md:px-10 py-8 bg-white border-b border-gray-100">
      <h2 className="text-2xl font-semibold mb-4">Photo tour</h2>
      <div ref={navRef} className="flex space-x-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.name}
            ref={activeCategory === cat.name ? activeItemRef : null}
            onClick={() => onSelect(cat.name)}
            className="flex-shrink-0 text-left group"
          >
            <div className="relative">
              <img
                src={cat.images[0]}
                alt={cat.name}
                className={`w-40 h-24 object-cover mb-2 rounded-lg transition-all duration-300 ${
                  activeCategory === cat.name
                    ? 'ring-2 ring-black shadow-lg scale-105'
                    : 'hover:opacity-70 hover:scale-102'
                }`}
              />
              {activeCategory === cat.name && (
                <div className="absolute inset-0 bg-black bg-opacity-10 rounded-lg transition-all duration-300" />
              )}
            </div>
            <span
              className={`text-sm font-medium transition-colors duration-200 ${
                activeCategory === cat.name
                  ? 'text-black font-semibold'
                  : 'text-gray-600 group-hover:text-gray-800'
              }`}
            >
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

const ImageSection = React.forwardRef<
  HTMLDivElement,
  {
    category: ImageCategory;
    isFirst?: boolean;
    onImageClick: (images: string[], startIndex: number, categoryName: string) => void;
  }
>(({ category, isFirst = false, onImageClick }, ref) => {
  return (
    <section
      ref={ref}
      id={`section-${category.name.replace(/\s+/g, '-')}`}
      className={`grid grid-cols-1 lg:grid-cols-2 gap-x-12 ${isFirst ? 'pt-16 pb-12' : 'py-12'}`}
    >
      <div className="lg:sticky lg:top-20 lg:self-start h-auto mb-6 lg:mb-0">
        <h3 className="text-2xl font-semibold">{category.name}</h3>
        {category.description && (
          <p className="text-gray-600 mt-2 text-base">{category.description}</p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {category.images.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`${category.name} ${index + 1}`}
            className="w-full h-auto object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
            onClick={() => onImageClick(category.images, index, category.name)}
          />
        ))}
      </div>
    </section>
  );
});

// Image Carousel Component
const ImageCarousel: React.FC<{
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onGoToImage: (index: number) => void;
  categoryName: string;
}> = ({ images, currentIndex, onClose, onNext, onPrev, onGoToImage, categoryName }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-[1000001] flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white">
          <h3 className="text-lg font-medium">{categoryName}</h3>
          <p className="text-sm opacity-75">
            {currentIndex + 1} of {images.length}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
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

      {/* Main Image */}
      <div className="relative w-full h-full flex items-center justify-center p-16">
        <img
          src={images[currentIndex]}
          alt={`${categoryName} ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain"
        />

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-3 rounded-full transition-colors"
              disabled={currentIndex === 0}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-3 rounded-full transition-colors"
              disabled={currentIndex === images.length - 1}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 max-w-xl overflow-x-auto px-4">
          {images.map((src, index) => (
            <button
              key={index}
              onClick={() => onGoToImage(index)}
              className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-white'
                  : 'border-transparent opacity-60 hover:opacity-80'
              }`}
            >
              <img
                src={src}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const GalleryContent: React.FC<{ houseInfo: HouseInfo; onClose: () => void }> = ({
  houseInfo,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [carouselState, setCarouselState] = useState<{
    isOpen: boolean;
    images: string[];
    currentIndex: number;
    categoryName: string;
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
    categoryName: '',
  });
  const sectionRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const imageCategories = houseInfo.image_categories || [];
  sectionRefs.current = imageCategories.map(
    (_, i) => sectionRefs.current[i] ?? React.createRef<HTMLDivElement>(),
  );

  // Carousel functions
  const openCarousel = (images: string[], startIndex: number, categoryName: string) => {
    setCarouselState({
      isOpen: true,
      images,
      currentIndex: startIndex,
      categoryName,
    });
  };

  const closeCarousel = () => {
    setCarouselState((prev) => ({ ...prev, isOpen: false }));
  };

  const nextImage = () => {
    setCarouselState((prev) => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, prev.images.length - 1),
    }));
  };

  const prevImage = () => {
    setCarouselState((prev) => ({
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0),
    }));
  };

  const goToImage = (index: number) => {
    setCarouselState((prev) => ({ ...prev, currentIndex: index }));
  };

  useEffect(() => {
    if (!imageCategories.length) return;
    setActiveCategory(imageCategories[0].name);

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the section that's most in view
        let maxIntersectionRatio = 0;
        let activeEntry: IntersectionObserverEntry | null = null;

        entries.forEach((entry) => {
          if (entry.intersectionRatio > maxIntersectionRatio) {
            maxIntersectionRatio = entry.intersectionRatio;
            activeEntry = entry;
          }
        });

        if (activeEntry && (activeEntry as IntersectionObserverEntry).intersectionRatio > 0.3) {
          const targetElement = (activeEntry as IntersectionObserverEntry).target as HTMLElement;
          const sectionName = targetElement.id.replace('section-', '').replace(/-/g, ' ');
          setActiveCategory(sectionName);
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: '-100px 0px -30% 0px', // Account for CategoryNav and better section detection
      },
    );

    sectionRefs.current.forEach((ref) => ref.current && observer.observe(ref.current));
    return () =>
      sectionRefs.current.forEach((ref) => ref.current && observer.unobserve(ref.current));
  }, [imageCategories.length]);

  const handleSelectCategory = (name: string) => {
    // Update active category immediately for better UX
    setActiveCategory(name);

    const sectionId = `section-${name.replace(/\s+/g, '-')}`;
    const sectionElement = scrollContainerRef.current?.querySelector(`#${sectionId}`);
    const scrollContainer = scrollContainerRef.current;

    if (sectionElement && scrollContainer) {
      // Get the CategoryNav height since it's now part of the scrollable content
      const categoryNavElement = scrollContainer.querySelector('.border-b');
      const categoryNavHeight = categoryNavElement
        ? categoryNavElement.getBoundingClientRect().height
        : 0;

      // Add some padding for better visual spacing
      const extraPadding = 20;
      const totalOffset = categoryNavHeight + extraPadding;

      // Calculate the position of the section relative to the scroll container
      const sectionRect = sectionElement.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();

      // Calculate target scroll position
      const targetScrollTop =
        scrollContainer.scrollTop + sectionRect.top - containerRect.top - totalOffset;

      // Smooth scroll to target position
      scrollContainer.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <ModalHeader onClose={onClose} houseInfo={houseInfo} />
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <CategoryNav
            categories={imageCategories}
            activeCategory={activeCategory}
            onSelect={handleSelectCategory}
          />
          <main className="px-6 md:px-10">
            {imageCategories.map((category, index) => (
              <ImageSection
                key={category.name}
                category={category}
                isFirst={index === 0}
                onImageClick={openCarousel}
                ref={sectionRefs.current[index]}
              />
            ))}
          </main>
        </div>
      </div>

      {/* Image Carousel */}
      {carouselState.isOpen && (
        <ImageCarousel
          images={carouselState.images}
          currentIndex={carouselState.currentIndex}
          categoryName={carouselState.categoryName}
          onClose={closeCarousel}
          onNext={nextImage}
          onPrev={prevImage}
          onGoToImage={goToImage}
        />
      )}
    </div>
  );
};

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({ isOpen, onClose, houseInfo }) => {
  const shouldRender = useShouldRender(isOpen);
  useBodyOverflow(isOpen);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setIsAnimatingIn(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingIn(false);
      return;
    }
  }, [isOpen]);

  if (!shouldRender || !houseInfo || !houseInfo.image_categories) return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed inset-0 bg-white z-[1000000] transition-transform duration-300 ease-in-out ${
        isAnimatingIn ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <GalleryContent houseInfo={houseInfo} onClose={onClose} />
    </div>,
    document.body,
  );
};

export default ImageGalleryModal;
