import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import star from '../../asset/Icons_svg/star.svg';
import spray from '../../asset/Icons_svg/Spray.svg';
import checkMark from '../../asset/Icons_svg/accuracy.svg';
import key from '../../asset/Icons_svg/key.svg';
import msg from '../../asset/Icons_svg/msg.svg';
import location from '../../asset/Icons_svg/location.svg';
import value from '../../asset/Icons_svg/value.svg';
import leftLaurel from '../../asset/Extra/leftLaurel.png';
import rightLaurel from '../../asset/Extra/rightLaurel.png';

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
      setTimeout(() => setShouldRender(false), 150);
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
    className="w-10 h-10 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded-full"
  >
    <span className="text-xl">×</span>
  </button>
);

export interface ReviewItem {
  id: number;
  guest_name: string;
  created_at: string;
  overall_rating: number;
  comment: string;
  guest_avatar: string;
}

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  overallRating: number;
  totalReviews: number;
  ratingDistribution: number[];
  ratings: {
    cleanliness: number;
    accuracy: number;
    checkin: number;
    communication: number;
    location: number;
    value: number;
  };
  reviews: ReviewItem[];
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({
  isOpen,
  onClose,
  overallRating,
  totalReviews,
  ratingDistribution,
  ratings,
  reviews,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { visible, shouldRender } = useModalVisibility(isOpen);
  useBodyOverflow(isOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  const filteredReviews = reviews.filter(
    (r) =>
      (r.comment && r.comment.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.guest_name && r.guest_name.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!shouldRender) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999999] p-2"
      onClick={handleOverlayClick}
    >
      <div
        ref={ref}
        className={`bg-white ${
          visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } transition-all duration-200 ease-in-out rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.28)] w-full max-w-[1031px] max-h-[96vh] flex flex-col`}
      >
        <div className="pl-2 pr-6 pt-4 pb-0">
          <CloseButton onClose={onClose} />
        </div>

        <div className="flex-1 overflow-hidden flex gap-10 px-8 pb-8">
          <div className="w-96 border-r border-transparent flex flex-col">
            {overallRating >= 4.8 && (
              <div className="px-6 py-8 flex flex-col items-center border-b border-gray-200">
                <div className="flex items-center mb-3">
                  <img
                    className="h-24 object-contain"
                    src={leftLaurel}
                    alt="Guest Favourite Laurel Left"
                  />
                  <span className="text-5xl font-bold mx-3">{overallRating.toFixed(1)}</span>
                  <img
                    className="h-24 object-contain"
                    src={rightLaurel}
                    alt="Guest Favourite Laurel Right"
                  />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-lg mb-2">Guest favorite</div>
                  <div className="text-sm text-gray-600 max-w-xs leading-tight">
                    This home is in the <span className="font-semibold text-gray-900">top 10%</span>{' '}
                    of eligible listings based on ratings, reviews, and reliability.
                  </div>
                </div>
              </div>
            )}

            <div className="px-6 py-6 flex-1 overflow-auto">
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Overall rating</h3>
                <ol>
                  {[5, 4, 3, 2, 1].map((rating, idx) => (
                    <li key={rating} className="flex items-center gap-2 mb-2">
                      <span className="text-xs w-3 text-right">{rating}</span>
                      <div className="w-full h-1 bg-gray-200">
                        <div
                          className="h-full bg-black"
                          style={{ width: `${ratingDistribution[idx]}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {[
                { title: 'Cleanliness', score: ratings.cleanliness.toFixed(1), icon: spray },
                { title: 'Accuracy', score: ratings.accuracy.toFixed(1), icon: checkMark },
                { title: 'Check-in', score: ratings.checkin.toFixed(1), icon: key },
                { title: 'Communication', score: ratings.communication.toFixed(1), icon: msg },
                { title: 'Location', score: ratings.location.toFixed(1), icon: location },
                { title: 'Value', score: ratings.value.toFixed(1), icon: value },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <img className="w-5 h-5" src={item.icon} alt={item.title} />
                    <span className="text-xs">{item.title}</span>
                  </div>
                  <span className="text-xs font-medium">{item.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="px-8 py-6 border-b border-transparent">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-xl font-medium">{totalReviews} reviews</div>
                  <button className="text-xs underline text-gray-600 hover:text-black text-left mt-1">
                    Learn how reviews work
                  </button>
                </div>
                <div className="relative" ref={sortRef}>
                  <button
                    onClick={() => setIsSortOpen((v) => !v)}
                    className="px-4 py-2 border border-gray-300 rounded-full text-sm flex items-center gap-2 hover:bg-gray-50"
                  >
                    <span>Most relevant</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-4 h-4"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {isSortOpen && (
                    <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white shadow-[0_8px_28px_rgba(0,0,0,0.12)] overflow-hidden z-50">
                      <div className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                        Most relevant
                      </div>
                      <div className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                        Most recent
                      </div>
                      <div className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                        Highest rated
                      </div>
                      <div className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                        Lowest rated
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 px-8 py-6 overflow-y-auto">
              <div className="mb-6">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-5 h-5"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.3-4.3" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search reviews"
                    className="w-full border border-gray-300 rounded-full py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-6">
                {filteredReviews.map((r) => (
                  <div key={r.id} className="">
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        className="h-12 w-12 rounded-full object-cover"
                        src={r.guest_avatar}
                        alt={r.guest_name}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{r.guest_name}</span>
                        <span className="text-sm text-gray-600">
                          {new Date(r.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: r.overall_rating || 0 }).map((_, i) => (
                        <img key={i} className="w-4 h-4" src={star} alt="star" />
                      ))}
                    </div>
                    <p className="text-[15px] leading-5 text-[#222]">{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ReviewsModal;
