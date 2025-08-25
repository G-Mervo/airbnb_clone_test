import star from '../../asset/Icons_svg/star.svg';
import leftLaurel from '../../asset/Extra/leftLaurel.png';
import rightLaurel from '../../asset/Extra/rightLaurel.png';
interface GuestFavoriteBadgeProps {
  rating: number;
  reviewsCount: number;
  onClick: () => void;
}

const GuestFavoriteBadge: React.FC<GuestFavoriteBadgeProps> = ({
  rating,
  reviewsCount,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="border border-gray-300 rounded-xl p-4 my-2 flex items-center gap-x-5 cursor-pointer hover:bg-gray-50 transition-colors w-full"
    >
      {/* Section 1: Laurel + "Guest favorite" */}
      <div className="flex items-center gap-2">
        <img src={leftLaurel} alt="Guest Favorite Laurel" className="h-10 w-auto" />
        <div className="font-semibold text-lg text-center leading-tight">
          <span>Guest</span>
          <br />
          <span>favorite</span>
        </div>
        <img src={rightLaurel} alt="Guest Favorite Laurel" className="h-10 w-auto" />
      </div>

      {/* Section 2: Description */}
      <p className="text-normal flex-1 leading-tight">
        One of the most loved homes on Airbnb, according to guests
      </p>

      {/* Section 3 & 4: Rating & Reviews (separated by a divider) */}
      <div className="flex items-center gap-4">
        {/* Rating */}
        <div className="flex flex-col items-center">
          <span className="font-semibold text-base">{rating.toFixed(1)}</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <img key={i} src={star} className="w-3 h-3" alt="star" />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-10 border-l border-gray-300"></div>

        {/* Reviews */}
        <div className="flex flex-col items-center">
          <span className="font-semibold text-base">{reviewsCount}</span>
          <span className="text-sm font-light">Reviews</span>
        </div>
      </div>
    </div>
  );
};

export default GuestFavoriteBadge;
