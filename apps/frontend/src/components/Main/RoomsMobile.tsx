import React from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import star from '../../asset/Icons_svg/star.svg';
import arrow_right from '../../asset/Icons_svg/arrow-right.svg';
import arrow_left from '../../asset/Icons_svg/arrow-left.svg';

import {
  removeUserFavListing,
  setHoveredItem,
  setHoveredItems,
  setIsFavorite,
  setItemId,
  setShowLogin,
  setUserFavListing,
} from '../../redux/AppSlice';
import { svg as favSvg } from '../../asset/HeartIconSvg';
import { Link } from 'react-router-dom';

// Utility component to render rating stars and rating value
const Rating = ({ rating }) => (
  <div className="flex-center space-x-1">
    {rating > 2 && <img src={star} className="w-[15px] h-[15px]" alt="Star" />}
    <span className="font-light text-[15px]">{rating > 2 && rating}</span>
  </div>
);

// Guest Favorite Badge component
const GuestFavoriteBadge = () => (
  <div
    className={`absolute z-[1] w-32 flex-center top-3 left-3 rounded-2xl`}
    style={{ backgroundColor: '#eae8e6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
  >
    <span className="text-sm font-medium">Guest favourite</span>
  </div>
);

// Favorite Button component
const FavoriteButton = ({ item, favListings, userData }) => {
  const dispatch = useDispatch();

  return (
    <button
      aria-label="add favourite button"
      onClick={async (e) => {
        e.preventDefault();
        if (!userData) {
          dispatch(setShowLogin(true));
        } else {
          if (favListings.includes(item.id)) {
            dispatch(removeUserFavListing(item.id));
            dispatch(setIsFavorite(false));
            dispatch(setItemId(item.id));
            try {
              const m = await import('../../api/apiAuthentication');
              await m.deleteFavorite(item.id);
            } catch {}
          } else {
            dispatch(setUserFavListing(item.id));
            dispatch(setIsFavorite(true));
            dispatch(setItemId(item.id));
            try {
              const m = await import('../../api/apiAuthentication');
              await m.saveFavorite(item.id);
            } catch {}
          }
        }
      }}
      className="absolute hover:scale-110 top-3 right-4 z-50 pointer-events-auto"
    >
      {favSvg(item?.id, favListings, userData)}
    </button>
  );
};

// Scroll Button component
const ScrollButton = ({ direction, onClick }) => (
  <button
    onClick={onClick}
    className="z-[2] bg-white hover:scale-105 w-8 flex-center hover:bg-opacity-100 bg-opacity-80 h-8 absolute hover:drop-shadow-md rounded-[50%] border-[1px] border-grey-dim"
    style={{ [direction === 'left' ? 'left' : 'right']: '2px' }}
  >
    <img
      className="h-4 w-6"
      src={direction === 'left' ? arrow_left : arrow_right}
      alt={`Scroll ${direction}`}
    />
  </button>
);

const RenderScrollButtons = ({ hoveredItem, localScrollPositions, item, handleScrollBtn }) => {
  return (
    <>
      {hoveredItem === item.id && !localScrollPositions[item.id]?.isAtStart && (
        <ScrollButton direction="left" onClick={(e) => handleScrollBtn(e, 'left', item.id)} />
      )}
      {hoveredItem === item.id && !localScrollPositions[item.id]?.isAtEnd && (
        <ScrollButton direction="right" onClick={(e) => handleScrollBtn(e, 'right', item.id)} />
      )}
    </>
  );
};

const ImageItem = ({ src, alt, index }) => (
  <img
    className="rounded-[20px] flex-center 2xl:rounded-[30px] w-full h-full object-cover scroll-snap-align-start"
    src={src}
    alt={`${alt}${index > 0 ? ` - ${index + 1}` : ''}`}
    style={{
      scrollSnapAlign: 'start',
      scrollSnapStop: 'always',
      flexShrink: 0,
      aspectRatio: '1/1',
      backgroundColor: '#DBDBDB',
    }}
  />
);

const RenderHouseImages = ({ hoveredItems, item }) => {
  const { images, id, title } = item;
  const isHovered = hoveredItems?.includes(id);

  return (
    <>
      {images.slice(0, 2).map((img, index) => (
        <ImageItem key={index} src={img} alt={title} index={index} />
      ))}
      {isHovered &&
        images
          .slice(2)
          .map((img, index) => (
            <ImageItem key={index + 2} src={img} alt={title} index={index + 2} />
          ))}
    </>
  );
};
// Main PropertyCard Component

const MobilePropertyCard = ({
  item,
  localScrollPositions,
  userData,
  favListings,
  handleScroll,
  handleScrollBtn,
  houseImagesRefs,
  index,
}) => {
  const { hoveredItem, hoveredItems } = useSelector((store: any) => store.app);
  const dispatch = useDispatch();

  const handleMouseLeave = () => dispatch(setHoveredItem(null));

  const renderHouseInfo = () => {
    const fontStack =
      '"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif';
    const titleStyle: React.CSSProperties = {
      fontFamily: fontStack,
      fontSize: '14px',
      lineHeight: '20.02px',
      fontWeight: 400,
      letterSpacing: 'normal',
      color: '#222222',
    };
    const descStyle: React.CSSProperties = {
      fontFamily: fontStack,
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 400,
      letterSpacing: 'normal',
      color: '#6A6A6A',
    };
    const monthlyPrice = Math.ceil(item.base_price / 83);
    const ratingValue = (item.average_rating ?? item.rating) as number | undefined;
    return (
      <div className="flex w-full justify-between items-start h-[25%]">
        <div className="w-full">
          <p className="truncate w-[90%]" style={titleStyle}>
            {item.title}
          </p>
          <div className="flex items-center gap-1 mt-[2px]">
            <span style={descStyle}>${monthlyPrice} dollars monthly</span>
            {typeof ratingValue === 'number' && (
              <>
                <span style={descStyle} className="mx-1">
                  •
                </span>
                <img src={star} alt="Star" className="w-3 h-3" />
                <span style={descStyle}>{ratingValue.toFixed(1)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div key={item.id} className="cursor-default" aria-disabled="true">
      <motion.div
        className="1xl:w-full relative 1xl:h-full flex gap-y-4 items-center justify-center flex-col"
        onMouseLeave={handleMouseLeave}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: index * 0.07 }}
      >
        {item.is_guest_favorite && <GuestFavoriteBadge />}

        <div
          ref={(el) => (houseImagesRefs.current[item.id] = el)}
          className="w-full flex items-center justify-start overflow-x-auto hide-scrollbar h-[75%] scroll-smooth"
          style={{
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
          }}
          onScroll={() => {
            handleScroll(item.id);
            dispatch(setHoveredItems([...new Set([...hoveredItems, item.id])]));
          }}
        >
          <RenderScrollButtons
            hoveredItem={hoveredItem}
            localScrollPositions={localScrollPositions}
            item={item}
            handleScrollBtn={handleScrollBtn}
          ></RenderScrollButtons>
          <RenderHouseImages item={item} hoveredItems={hoveredItems}></RenderHouseImages>
        </div>

        {/* Place FavoriteButton outside the scrollable container but after it in DOM to beat transform stacking */}
        <div className="absolute top-3 right-4 z-[2] transition-transform hover:scale-110 pointer-events-auto">
          <FavoriteButton item={item} favListings={favListings} userData={userData} />
        </div>

        {renderHouseInfo()}
      </motion.div>
    </div>
  );
};

export default MobilePropertyCard;
