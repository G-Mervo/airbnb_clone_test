import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setActiveInput } from "../../redux/mainFormSlice";
import { setMinimize } from "../../redux/AppSlice";

// Temporarily disable unresolved imports until those components exist
// Replace with real components when available
const CustomerReviews = ({ showReviewSection }: { showReviewSection: boolean }) => null;
const GuestFavouriteBadge = () => null;
const RatingsSection = ({ showReviewSection }: { showReviewSection: boolean }) => null;

// Utility function to check if rating count exceeds 10
const hasMultipleReviews = (ratingCount: string | undefined | null) => {
  const numberMatch = ratingCount?.match(/\d+/);
  const number = numberMatch ? parseInt(numberMatch[0], 10) : 0;

  return number > 10;
};

// Custom hook for responsive review section visibility
const useReviewSectionVisibility = (guestFavorite: string | undefined) => {
  const [showReviewSection, setShowReviewSection] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const handleResize = () => {
      // Reset form state
      dispatch(setActiveInput(""));
      dispatch(setMinimize(false));

      // Update review section visibility based on screen width
      const shouldShowSection =
        window.innerWidth > 824 || guestFavorite === "Guest favourite";

      setShowReviewSection(shouldShowSection);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, [guestFavorite, dispatch]);

  return showReviewSection;
};

// Container component for review sections
const ReviewSectionsContainer = ({
  showReviewSection,
  children,
}: {
  showReviewSection: boolean;
  children: React.ReactNode;
}) => {
  return (
    <div
      id="Reviews"
      className={`
        ${showReviewSection ? "pt-12 " : " "}
        relative border-t 1xz:border-none w-full border-grey-dim 
        bg-shadow-gray-light 1xz:bg-white
      `}
    >
      {children}
    </div>
  );
};

// Main Review component
const Review = () => {
  const houseInfo = useSelector((store: any) => store.houseDetail.houseInfo);
  const showReviewSection = useReviewSectionVisibility(
    houseInfo.guest_favorite
  );
  const hasEnoughReviews = hasMultipleReviews(houseInfo?.rating_count);

  return (
    <ReviewSectionsContainer showReviewSection={showReviewSection}>
      <GuestFavouriteBadge />

      <RatingsSection showReviewSection={showReviewSection} />

      {hasEnoughReviews && (
        <CustomerReviews showReviewSection={showReviewSection} />
      )}
    </ReviewSectionsContainer>
  );
};

export default Review;
