import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import star from "../../asset/Icons_svg/star.svg";
import { setShowLogin } from "../../redux/AppSlice";

// A reusable component for navigation links
const NavLink: React.FC<{ onClick: (event: React.MouseEvent) => void; href: string; label: string }> = ({ 
  onClick, 
  href, 
  label 
}) => (
  <a
    onClick={onClick}
    href={href}
    className="text-black text-sm font-medium h-full flex items-center justify-center border-b-4 border-white hover:border-black transition-colors"
  >
    {label}
  </a>
);

// Component for showing the price and reviews section
const PriceAndReviews: React.FC<{ houseInfo: any; houseRating: boolean; reviewsCount: boolean }> = ({ 
  houseInfo, 
  houseRating, 
  reviewsCount 
}) => (
  <div className="h-full gap-5 flex items-center">
    <div className="flex flex-col justify-center gap-y-1">
      <div className="flex items-end gap-x-1">
        <span className="font-medium text-base">${houseInfo?.price}</span>
        <span className="text-sm font-light">night</span>
      </div>
      <div className="flex gap-x-1 items-center">
        <img src={star} className="h-3 w-3" alt="Rating" />
        <span className="text-xs font-medium">
          {houseRating && formatSingleDigit(houseInfo?.house_rating || houseInfo?.rating)}
        </span>
        <span className="flex items-center justify-center">
          <span className="w-[2px] h-[2px] bg-current rounded-full"></span>
        </span>
        <span className="text-xs font-extralight">
          {reviewsCount > 0 && `${reviewsCount} reviews`}
        </span>
      </div>
    </div>
    <ReserveButton houseInfo={houseInfo} />
  </div>
);

// Component for the Reserve button
const ReserveButton: React.FC<{ houseInfo: any }> = ({ houseInfo }) => {
  const dispatch = useDispatch();
  const userData = useSelector((store: any) => store.app.userData);
  
  const handleClick = (e: React.MouseEvent) => {
    if (!userData) {
      e.preventDefault();
      dispatch(setShowLogin(true));
    }
  };

  return (
    <Link to={userData ? `/${houseInfo?.id}/book` : "#"} onClick={handleClick}>
      <button className="w-[9.5rem] h-12 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-[#EB194B] via-[#E01463] to-[#CF0E7C] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]">
        <span className="text-white font-medium">Reserve</span>
      </button>
    </Link>
  );
};

const NavbarChild: React.FC<{ isVisible: boolean; houseInfo: any }> = ({ isVisible, houseInfo }) => {
  const houseRating = Boolean(houseInfo?.house_rating > 2 || houseInfo?.rating > 2);
  const reviewsCount = houseInfo?.rating_count || 0;
  
  return (
    <nav className="h-full max-w-7xl lg:px-20 px-10 w-full flex items-center justify-between">
      <div className="h-full gap-x-6 w-[20rem] flex items-center">
        {/* Reusable navigation links */}
        <NavLink
          onClick={scrollToSection("images")}
          href="#images"
          label="Photos"
        />
        <NavLink
          onClick={scrollToSection("amenities")}
          href="#amenities"
          label="Amenities"
        />
        <NavLink
          onClick={scrollToSection("reviews")}
          href="#reviews"
          label="Reviews"
        />
        <NavLink
          onClick={scrollToSection("location")}
          href="#location"
          label="Location"
        />
      </div>

      {/* Show price and reviews only when not at top */}
      {!isVisible && (
        <PriceAndReviews
          houseInfo={houseInfo}
          houseRating={houseRating}
          reviewsCount={reviewsCount}
        />
      )}
    </nav>
  );
};

const scrollToSection = (sectionId: string) => (event: React.MouseEvent) => {
  event.preventDefault();
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest",
    });
  }
};

function formatSingleDigit(number: number): string {
  // Convert the number to a string
  let numStr = number.toString();

  // Split the number into the integer and decimal parts
  let [integerPart, decimalPart] = numStr.split(".");

  // Check if the integer part is a single digit and decimal part is undefined
  if (integerPart.length === 1 && !decimalPart) {
    // Append ".0" to the single-digit number
    numStr = integerPart + ".0";
  }

  return numStr;
}

// Main Component
const NavBar: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [showNav, setShowNav] = useState(false);
  const [showPriceSection, setShowPriceSection] = useState(false);
  const houseInfo = useSelector((store: any) => store.houseDetail.houseInfo[id!]);

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY;
      
      // Show navigation when scrolled past 566px (after images section)
      if (scrollY > 566) {
        setShowNav(true);
      } else {
        setShowNav(false);
      }

      // Show price section when reaching the reviews section
      const reviewsSection = document.getElementById("reviews");
      if (reviewsSection) {
        const reviewsSectionTop = reviewsSection.offsetTop;
        // Show price section when we've reached the reviews section
        if (scrollY >= reviewsSectionTop - 100) { // -100px offset for earlier trigger
          setShowPriceSection(true);
        } else {
          setShowPriceSection(false);
        }
      } else {
        // Fallback to approximate value if reviews section not found
        if (scrollY > 1200) { // Earlier trigger since we want it at reviews, not after
          setShowPriceSection(true);
        } else {
          setShowPriceSection(false);
        }
      }
    }

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={`w-full h-20 bg-white fixed top-0 z-50 ${
        showNav ? "flex items-center justify-center" : "hidden"
      } border-b border-gray-200 shadow-sm`}
    >
      <NavbarChild isVisible={!showPriceSection} houseInfo={houseInfo} />
    </div>
  );
};

export default NavBar;