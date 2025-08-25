// @ts-nocheck
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { setShowLogin } from "../../redux/AppSlice";
import { useDispatch, useSelector } from "react-redux";
import { getUserLogout } from "../../api/apiAuthentication";
import { Link } from "react-router-dom";

// Icons (ESM imports — no require)
import { Heart, BedDouble, User as UserIcon, Settings, Globe, CircleHelp } from "../icons/Lucide";
import promoFallback from "../../asset/ProfilePageSvg/MobileAirbnb.svg";
import houseImg from "../../asset/house.png";

const MenuRow = ({ icon, text, to, onClick, iconClass = "", fontWeight = "normal", compact = false, isFirst = false }: any) => {
  const content = (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center ${icon ? 'gap-3' : ''} px-5 text-left text-[15px] ${compact ? 'py-2' : 'py-4'} ${isFirst ? 'hover:bg-neutral-50 rounded-t-3xl' : 'hover:bg-neutral-50'}`}
      style={{ fontWeight }}
    >
      {icon && (
        <span className="text-neutral-800">
          {typeof icon === "string" ? (
            <img src={icon} className={`h-[20px] w-[20px] opacity-90 ${iconClass}`} alt="" />
          ) : (
            icon
          )}
        </span>
      )}
      <span className="text-neutral-800">{text}</span>
    </button>
  );
  return to ? <Link to={to as any}>{content}</Link> : content;
};

const UserDmodal = ({ isOpen }) => {
  const dispatch = useDispatch();
  const [position, setPosition] = useState<any>(null);
  let userData = useSelector((store: any) => store.app.userData);

  useEffect(() => {
    function updatePosition() {
      const userDashBoardEl = document.getElementById("user-dashboard");
      if (userDashBoardEl) {
        let rect = userDashBoardEl.getBoundingClientRect();
        setPosition({
          right: `${((window.innerWidth - rect.right) / window.innerWidth) * 100}%`,
          top: `${(rect.bottom / window.innerHeight) * 100}%`,
        });
      }
    }
    if (isOpen) {
      updatePosition();
    }
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [isOpen]);

  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div
      style={position as any}
      className="fixed mt-2 hidden 1xz:flex flex-col rounded-3xl border border-neutral-200 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)] w-[360px] z-[101000]"
      role="menu"
    >
      {userData ? (
        <div>
          {/* Group 1: Wishlists, Trips, Profile */}
          <div className="pt-1">
            <MenuRow icon={<Heart className="h-5 w-5" />} text="Wishlists" to="/wishlist" isFirst={true} />
            <MenuRow icon={<BedDouble className="h-5 w-5" />} text="Trips" to="/trips" />
            <MenuRow icon={<UserIcon className="h-5 w-5" />} text="Profile" to="/account-settings" />
          </div>

          {/* Divider */}
          <div className="mx-5 my-1 h-px bg-neutral-200" />

          {/* Group 2: Account settings, Languages & currency, Help Center */}
          <div>
            <MenuRow icon={<Settings className="h-5 w-5" />} text="Account settings" to="/account-settings" />
            <MenuRow icon={<Globe className="h-5 w-5" />} text="Languages & currency" />
            <MenuRow icon={<CircleHelp className="h-5 w-5" />} text="Help Center" />
          </div>

          {/* Divider */}
          <div className="mx-5 my-1 h-px bg-neutral-200" />

          {/* Promo */}
          <div className="flex items-center justify-between gap-4 px-5 py-5">
            <div>
              <div className="text-[17px] font-semibold tracking-tight">Become a host</div>
              <div className="mt-1 text-[15px] leading-6 text-neutral-500">
                It's easy to start hosting and earn extra income.
              </div>
            </div>
            <div className="shrink-0">
              <img src={houseImg} onError={(e) => { (e.currentTarget as HTMLImageElement).src = promoFallback; }} className="h-16 w-auto" alt="Become a host" />
            </div>
          </div>

          {/* Divider */}
          <div className="mx-5 my-1 h-px bg-neutral-200" />

          {/* Footer: Log out */}
          <button
            role="menuitem"
            className="block w-full rounded-b-3xl px-5 py-4 text-left text-[15px] font-medium hover:bg-neutral-50"
            onClick={getUserLogout}
          >
            Log out
          </button>
        </div>
      ) : (
        <div>
          {/* Help Center first */}
          <div className="pt-1">
            <MenuRow icon={<CircleHelp className="h-5 w-5" />} text="Help Center" isFirst={true} />
          </div>
          {/* Divider */}
          <div className="mx-5 my-1 h-px bg-neutral-200" />
          {/* Promo */}
          <div className="flex items-center justify-between gap-4 px-5 py-5">
            <div>
              <div className="text-[17px] font-semibold tracking-tight">Become a host</div>
              <div className="mt-1 text-[15px] leading-6 text-neutral-500">
                It's easy to start hosting and earn extra income.
              </div>
            </div>
            <div className="shrink-0">
              <img src={houseImg} onError={(e) => { (e.currentTarget as HTMLImageElement).src = promoFallback; }} className="h-16 w-auto" alt="Become a host" />
            </div>
          </div>
          {/* Divider */}
          <div className="mx-5 my-1 h-px bg-neutral-200" />
          {/* Additional options for guests */}
          <div>
            <MenuRow text="Refer a Host" compact={true} />
            <MenuRow text="Find a co-host" compact={true} />
            <MenuRow text="Gift cards" compact={true} />
          </div>
          {/* Divider */}
          <div className="mx-5 my-1 h-px bg-neutral-200" />
          {/* Single CTA: Log in or sign up */}
          <button
            role="menuitem"
            className="block w-full rounded-b-3xl px-5 py-4 text-left text-[15px] hover:bg-neutral-50"
            onClick={() => dispatch(setShowLogin(true))}
          >
            Log in or sign up
          </button>
        </div>
      )}
    </div>,
    document.body
  );
};

export default UserDmodal;


