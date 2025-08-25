import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { svg as favSvg } from '../../asset/HeartIconSvg';
import {
  setShowLogin,
  setUserFavListing,
  removeUserFavListing,
  setIsFavorite,
  setItemId,
} from '../../redux/AppSlice';
import {
  generatePlaceholderImage,
  handleImageError,
  getSafeImageUrl,
} from '../../utils/imageUtils';

function Badge({ children }) {
  const minimize = useSelector((state: any) => state.app.minimize);

  return (
    <span
      className={`absolute left-3 top-3 text-gray-900 text-xs font-medium px-3 py-1.5 rounded-full transition-opacity duration-300 ${
        minimize ? 'opacity-40' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#eae8e6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', zIndex: 2 }}
    >
      {children}
    </span>
  );
}

function HeartButton({ itemId }: { itemId: string | number }) {
  const dispatch = useDispatch();
  const { userData, favListings, minimize } = useSelector((s: any) => ({
    userData: s.app.userData,
    favListings: s.app.userFavListing,
    minimize: s.app.minimize,
  }));

  return (
    <button
      aria-label="toggle favourite"
      className={`absolute right-3 top-3 w-7 h-7 flex items-center justify-center bg-transparent border-none hover:scale-110 transition-all duration-300 pointer-events-auto ${
        minimize ? 'opacity-40' : 'opacity-100'
      }`}
      style={{ zIndex: 2 }}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!userData) {
          dispatch(setShowLogin(true));
          return;
        }
        if (favListings.includes(itemId)) {
          dispatch(removeUserFavListing(itemId));
          dispatch(setIsFavorite(false));
          dispatch(setItemId(itemId));
          try {
            const m = await import('../../api/apiAuthentication');
            await m.deleteFavorite(itemId);
          } catch {}
        } else {
          dispatch(setUserFavListing(itemId));
          dispatch(setIsFavorite(true));
          dispatch(setItemId(itemId));
          try {
            const m = await import('../../api/apiAuthentication');
            await m.saveFavorite(itemId);
          } catch {}
        }
      }}
    >
      {favSvg(itemId, favListings, userData)}
    </button>
  );
}

function ListingCard({ item }) {
  const {
    id,
    images = [],
    city,
    country,
    base_price,
    title,
    average_rating,
    rating,
    is_new,
  } = item || {};

  const displayRating = average_rating ?? rating;
  const isGuestFavorite = typeof displayRating === 'number' && displayRating >= 4.9;

  const imageSrc = useMemo(() => {
    if (images && images.length > 0 && images[0]) {
      return getSafeImageUrl(images[0]) || images[0];
    } else {
      const firstLetter = title?.charAt(0)?.toUpperCase() || 'H';
      return generatePlaceholderImage(firstLetter);
    }
  }, [images, title]);

  return (
    <div className="w-full group cursor-pointer">
      <Link
        to={`/house/${id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block cursor-pointer"
      >
        <div className="block">
          <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-gray-100 mb-2">
            {is_new && <Badge>New</Badge>}
            {isGuestFavorite && <Badge>Guest favorite</Badge>}
            <HeartButton itemId={id} />
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const firstLetter = title?.charAt(0)?.toUpperCase() || 'H';
                  handleImageError(e.currentTarget, firstLetter);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                Loading...
              </div>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="font-medium text-gray-800 truncate pr-2 text-sm leading-tight">
              {title || 'Untitled Listing'}
            </h3>
            <div className="flex items-center gap-1 pr-2 text-xs text-gray-500">
              <span>${Math.ceil((base_price ?? 0) / 83)} monthly</span>
              {typeof displayRating === 'number' && (
                <>
                  <span aria-hidden className="mx-1">
                    {' '}
                    •{' '}
                  </span>
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 32 32">
                    <path d="M15.094 1.614L11.982 8.09L4.628 9.089C3.16 9.298 2.585 11.044 3.665 12.069L8.88 16.882L7.665 24.178C7.39 25.628 8.895 26.729 10.159 26.04L16.522 22.553L22.885 26.04C24.149 26.729 25.654 25.628 25.378 24.178L24.163 16.882L29.378 12.069C30.458 11.044 29.883 9.298 28.415 9.089L21.061 8.09L17.949 1.614C17.253 0.247 15.79 0.247 15.094 1.614Z"></path>
                  </svg>
                  <span>{Number(displayRating).toFixed(1)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ListingCard;
