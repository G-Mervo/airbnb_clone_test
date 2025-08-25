import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import filter_icon from "../../../asset/Icons_svg/filter_icon.svg";
import Toggle from "../Toggle";
import FilterModal from "../FilterModal";
import { setShowTotalBeforeTaxes } from "../../../redux/filterSlice";
import { countActiveFilters } from "../../../utils/filterUtils";

const FilterHome = () => {
  const dispatch = useDispatch();
  const filterState = useSelector((store: any) => store.filter);
  const activeFilterCount = countActiveFilters(filterState);
  
  const handleToggle = () => {
    dispatch(setShowTotalBeforeTaxes(!filterState.showTotalBeforeTaxes));
  };

  return (
    <div
      className={
        "w-[20.25rem] hidden  gap-x-[10px] mx-0    rounded-lg 1sm:flex items-center justify-around "
      }
    >
      <FilterModal />
      <div className="border-[1px]  hover:bg-gray-100 hover:border-black text-[11px] font-medium w-[240px] h-[48px] border-grey-dim rounded-xl flex justify-between  items-center ">
        <div className=" py-[15px] pr-[5px] px-[14px] " onClick={handleToggle}>
          <p>Display total before taxes</p>
        </div>
        <Toggle isChecked={filterState.showTotalBeforeTaxes} handleToggle={handleToggle}></Toggle>
      </div>
    </div>
  );
};

export default FilterHome;
