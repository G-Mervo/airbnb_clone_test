import React, { useEffect, useState } from 'react';
import share from '../../asset/Icons_svg/shareIcon.svg';
import dots from '../../asset/Icons_svg/dots.svg';
import { useNavigate, useParams } from 'react-router';
import arrowLeft from '../../asset/Icons_svg/arrow-left.svg';
import { useDispatch, useSelector } from 'react-redux';
import ImageGalleryModal, { ImageCategory } from './ImageGalleryModal';
import { svg } from '../../asset/HeartIconSvg';
import {
  removeUserFavListing,
  setIsFavorite,
  setItemId,
  setShowLogin,
  setUserFavListing,
} from '../../redux/AppSlice';

// Type definitions
interface HouseInfo {
  id: string;
  title_1: string;
  images: string[];
  image_categories?: ImageCategory[];
  [key: string]: any;
}

interface ActionBarProps {
  houseInfo: HouseInfo;
}

interface ImageCarouselProps {
  images: string[];
  onImageClick?: () => void;
}

interface CarouselImageProps {
  src: string;
  onClick?: () => void;
}

interface HouseImageCarouselProps {
  isLoading: boolean;
  houseInfo: HouseInfo;
  onImageClick?: () => void;
}

interface ActionButtonsProps {
  houseInfo: HouseInfo;
  userFavListing: string[];
  userData: any;
  dispatch: any;
}

interface HouseDetailHeaderProps {
  isLoading: boolean;
  houseInfo: HouseInfo;
  userFavListing: string[];
  userData: any;
}

interface ImageGridProps {
  gridLayout: string[];
  houseImages: string[];
  onShowAllPhotos: () => void;
}

interface ShowAllPhotosButtonProps {
  onClick: () => void;
}

interface HouseImagesSectionProps {
  isLoading: boolean;
  houseInfo: HouseInfo;
}

interface LoadingSkeletonProps {
  width: string;
}

// Image Carousel Skeleton for loading state
const ImageCarouselSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full">
      <div className="w-full h-full flex overflow-x-auto">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              aspectRatio: '16/10',
              width: '100%',
              height: '100%',
            }}
            className="bg-gray-200 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
};

const ActionBar: React.FC<ActionBarProps> = ({ houseInfo }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userData, userFavListing } = useSelector((store: any) => store.app);

  const isFavorite = userFavListing?.includes(houseInfo?.id);

  // Function to handle favorite logic
  const handleFavoriteToggle = (): void => {
    if (!userData) {
      dispatch(setShowLogin(true));
    } else {
      if (isFavorite) {
        dispatch(removeUserFavListing(houseInfo?.id));
        dispatch(setIsFavorite(false));
      } else {
        dispatch(setUserFavListing(houseInfo?.id));
        dispatch(setIsFavorite(true));
      }
      dispatch(setItemId(houseInfo?.id));
    }
  };

  return (
    <div className="w-full px-3 flex items-center justify-between h-16">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="h-8 w-8 rounded-full hover:bg-grey-dim flex items-center justify-center"
      >
        <img src={arrowLeft} className="w-4 h-4" alt="Go back" />
      </button>

      {/* Action Buttons */}
      <div className="space-x-2 items-center flex justify-between">
        {/* Share Button */}
        <button className="underline cursor-auto rounded-full h-8 w-8 flex items-center justify-center hover:bg-shadow-gray-light text-sm font-medium">
          <img className="w-5 h-5 py-[1px]" src={share} alt="Share" />
        </button>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteToggle}
          className="underline rounded-full w-8 h-8 flex items-center justify-center hover:bg-shadow-gray-light text-sm font-medium"
        >
          {svg(houseInfo?.id, userFavListing, userData)}
        </button>
      </div>
    </div>
  );
};

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, onImageClick }) => {
  return (
    <div
      className="w-full h-full flex overflow-x-auto"
      style={{
        scrollSnapType: 'x mandatory',
        scrollBehavior: 'smooth',
      }}
    >
      {images.map((img, index) => (
        <CarouselImage key={index} src={img} onClick={onImageClick} />
      ))}
    </div>
  );
};

const CarouselImage: React.FC<CarouselImageProps> = ({ src, onClick }) => (
  <div
    className="flex-shrink-0 w-full h-full cursor-pointer group"
    onClick={onClick}
    onTouchEnd={onClick}
    style={{
      scrollSnapAlign: 'start',
      pointerEvents: 'auto',
      touchAction: 'manipulation',
    }}
  >
    <img
      className="carousel-image w-full h-full object-cover transition duration-200 group-hover:brightness-90"
      src={src}
      alt="Property"
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    />
  </div>
);

const HouseImageCarousel: React.FC<HouseImageCarouselProps> = ({
  isLoading,
  houseInfo,
  onImageClick,
}) => {
  return (
    <div className="w-full min-h-80 h-full">
      {isLoading ? (
        <ImageCarouselSkeleton />
      ) : (
        <ImageCarousel images={houseInfo?.images || []} onImageClick={onImageClick} />
      )}
    </div>
  );
};

// Custom hook to handle favorite listing logic
function useFavoriteHandler(
  houseInfo: HouseInfo,
  userFavListing: string[],
  userData: any,
  dispatch: any,
) {
  const toggleFavorite = (): void => {
    if (!userData) {
      dispatch(setShowLogin(true));
    } else {
      const isFavorite = userFavListing.includes(houseInfo.id);
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

  return toggleFavorite;
}

// Share and Save Button Component
const ActionButtons: React.FC<ActionButtonsProps> = ({
  houseInfo,
  userFavListing,
  userData,
  dispatch,
}) => {
  const handleFavorite = useFavoriteHandler(houseInfo, userFavListing, userData, dispatch);

  return (
    <div className="pt-6 hidden 1xz:flex justify-between w-[10rem]">
      <button className="underline w-[5.2rem] rounded-md h-8 hover:bg-shadow-gray-light text-sm font-medium justify-center hover:cursor-pointer gap-2 items-center flex">
        <img className="w-[1.2rem] h-[1.2rem] pt-1" src={share} alt="Share" />
        <span className="h-[1.2rem]">Share</span>
      </button>

      <button
        onClick={handleFavorite}
        className="underline w-[4.8rem] rounded-md h-8 hover:bg-shadow-gray-light text-sm font-medium justify-center hover:cursor-pointer gap-2 items-center flex"
      >
        {svg(houseInfo?.id, userFavListing, userData)}
        <span className="h-[1.2rem]">Save</span>
      </button>
    </div>
  );
};

// Skeleton Loading Component
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ width }) => (
  <div
    className={`pt-6 bg-gray-200 animate-pulse text-[1.68rem] ${width} h-5 mt-10 font-[460]`}
  ></div>
);

const HouseDetailHeader: React.FC<HouseDetailHeaderProps> = ({
  isLoading,
  houseInfo,
  userFavListing,
  userData,
}) => {
  const dispatch = useDispatch();
  return (
    <div className="max-w-7xl w-full px-5 1xz:px-10 1lg:px-20 flex justify-between">
      <div>
        {isLoading ? (
          <LoadingSkeleton width="w-96" />
        ) : (
          <h1 className="pt-6 text-[1.68rem] hidden 1xz:block font-[460]">
            {houseInfo?.house_title || 'Property Title' | houseInfo?.name}
          </h1>
        )}
      </div>

      {isLoading ? (
        <LoadingSkeleton width="w-[10rem]" />
      ) : (
        <ActionButtons
          houseInfo={houseInfo}
          userFavListing={userFavListing}
          userData={userData}
          dispatch={dispatch}
        />
      )}
    </div>
  );
};

// Image Grid Loader (Skeleton for loading state)
const ImageGridLoader: React.FC<{ gridLayout: string[] }> = ({ gridLayout }) => (
  <div className="grid-areas rounded-xl overflow-hidden">
    {gridLayout.map((gridArea, index) => (
      <div key={index} className={`${gridArea} bg-gray-200 animate-pulse`}></div>
    ))}
  </div>
);

// Image Grid Component (Displays images after loading)
const ImageGrid: React.FC<ImageGridProps> = ({ gridLayout, houseImages, onShowAllPhotos }) => (
  <div className="grid-areas hidden 1xz:grid rounded-xl overflow-hidden">
    {gridLayout.map((gridArea, index) => (
      <div key={index} className={`${gridArea} relative group`}>
        {houseImages?.[index] && (
          <img
            src={houseImages[index]}
            alt={`House-image-${index + 1}`}
            className="w-full h-full object-cover cursor-pointer transition duration-200 group-hover:brightness-90"
            onClick={onShowAllPhotos}
          />
        )}
        {index === 4 && <ShowAllPhotosButton onClick={onShowAllPhotos} />}
      </div>
    ))}
  </div>
);

// Button to Show All Photos (Visible on the 5th image)
const ShowAllPhotosButton: React.FC<ShowAllPhotosButtonProps> = ({ onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center justify-center cursor-pointer text-nowrap w-[9rem] 1smm:w-[10rem] h-8 bg-white absolute bottom-5 right-2 1smm:right-5 gap-x-2 rounded-lg border-[1px] border-black"
  >
    <img src={dots} className="!w-4 !h-4" alt="Dots icon" />
    <span className="text-sm font-medium">Show all photos</span>
  </div>
);

const HouseImagesSection: React.FC<HouseImagesSectionProps> = ({ isLoading, houseInfo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleShowAllPhotos = (): void => setIsModalOpen(true);

  return (
    <div className="max-w-7xl hidden 1xz:block w-full px-10 1lg:px-20">
      <div className="pt-6">
        {isLoading ? (
          <ImageGridLoader gridLayout={gridLayout} />
        ) : (
          <ImageGrid
            gridLayout={gridLayout}
            houseImages={houseInfo?.images}
            onShowAllPhotos={handleShowAllPhotos}
          />
        )}
      </div>
    </div>
  );
};

// Pre-define the grid layout
const gridLayout = [
  'grid-area-image1',
  'grid-area-image2',
  'grid-area-image3',
  'grid-area-image4',
  'grid-area-image5',
];

// Main Component
const TopMainCont: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isLoading = useSelector((store: any) => store.houseDetail.isLoading);
  const houseInfo: HouseInfo | undefined = useSelector(
    (store: any) => store.houseDetail.houseInfo[id!],
  );

  const { userData, userFavListing, isFavorite } = useSelector((store: any) => store.app);

  const handleShowAllPhotos = (): void => {
    setIsModalOpen(true);
  };

  useEffect(() => {
    const handleUpdate = async (): Promise<void> => {
      if (houseInfo?.id && userData) {
        // Mock favorite save/delete - replace with actual API calls
        if (isFavorite) {
          console.log('Saving favorite:', houseInfo.id);
        } else {
          console.log('Deleting favorite:', houseInfo.id);
        }
      }
    };

    // Only run when isFavorite actually changes and we have the necessary data
    if (houseInfo?.id && userData) {
      handleUpdate();
    }
  }, [isFavorite, userData, houseInfo?.id]);
  const houseInfoWithCategories = houseInfo
    ? {
        ...houseInfo,
        image_categories: [
          {
            name: 'Living room',
            description:
              'Sofa bed - Air conditioning - Sound system - Books and reading material - TV',
            images: houseInfo.images.slice(0, 2),
          },
          {
            name: 'Full kitchen',
            description:
              'Hot water kettle - Dishes and silverware - Stove - Cooking basics - Microwave - Rice maker - Mini fridge',
            images: houseInfo.images.slice(2, 4),
          },
          { name: 'Kitchenette', images: houseInfo.images.slice(4, 5) },
          { name: 'Dining area', images: houseInfo.images.slice(5, 6) },
          { name: 'Bedroom', images: houseInfo.images.slice(6, 7) },
          { name: 'Full bathroom', images: houseInfo.images.slice(7, 8) },
          { name: 'Garage', images: houseInfo.images.slice(8, 9) },
          { name: 'Exterior', images: houseInfo.images.slice(9, 10) },
          { name: 'Pool', images: houseInfo.images.slice(10, 11) },
          { name: 'Additional photos', images: houseInfo.images.slice(11) },
        ].filter((cat) => cat.images.length > 0),
      }
    : undefined;

  return (
    <div id="images" className="flex items-center justify-center flex-col">
      <div className="w-full 1xz:hidden">
        <ActionBar houseInfo={houseInfo} />
        <HouseImageCarousel
          isLoading={isLoading}
          houseInfo={houseInfo}
          onImageClick={handleShowAllPhotos}
        />
      </div>
      <HouseDetailHeader
        houseInfo={houseInfo}
        isLoading={isLoading}
        userFavListing={userFavListing}
        userData={userData}
      />
      <div className="max-w-7xl hidden 1xz:block w-full px-10 1lg:px-20">
        <div className="pt-6">
          {isLoading ? (
            <ImageGridLoader gridLayout={gridLayout} />
          ) : (
            <ImageGrid
              gridLayout={gridLayout}
              houseImages={houseInfo?.images}
              onShowAllPhotos={handleShowAllPhotos}
            />
          )}
        </div>
      </div>
      <ImageGalleryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        houseInfo={houseInfoWithCategories}
      />
    </div>
  );
};

export default TopMainCont;
