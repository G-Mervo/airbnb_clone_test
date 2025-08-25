import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Minus, Plus } from "lucide-react";
import {
  setAdultCount,
  setChildCount,
  setInfantCount,
  setPetsCount,
} from "../../redux/mainFormSlice";

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuestCounterProps {
  title: string;
  subtitle: string;
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  minValue?: number;
  maxValue?: number;
}

const GuestCounter: React.FC<GuestCounterProps> = ({
  title,
  subtitle,
  count,
  onIncrement,
  onDecrement,
  minValue = 0,
  maxValue = 16,
}) => {
  const canDecrement = count > minValue;
  const canIncrement = count < maxValue;

  return (
    <div className="flex items-center justify-between py-6">
      <div>
        <div className="font-medium text-gray-900">{title}</div>
        <div className="text-sm text-gray-600">{subtitle}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onDecrement}
          disabled={!canDecrement}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
            canDecrement
              ? "border-gray-300 hover:border-gray-400 text-gray-700"
              : "border-gray-200 text-gray-300 cursor-not-allowed"
          }`}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-medium">{count}</span>
        <button
          onClick={onIncrement}
          disabled={!canIncrement}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
            canIncrement
              ? "border-gray-300 hover:border-gray-400 text-gray-700"
              : "border-gray-200 text-gray-300 cursor-not-allowed"
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const AddGuestModal: React.FC<AddGuestModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  
  const {
    adultCount,
    childCount,
    infantCount,
    petsCount,
  } = useSelector((store: any) => store.form);

  if (!isOpen) return null;

  const handleAdultIncrement = () => {
    if (adultCount < 16) {
      dispatch(setAdultCount(adultCount + 1));
    }
  };

  const handleAdultDecrement = () => {
    if (adultCount > 1) {
      dispatch(setAdultCount(adultCount - 1));
    }
  };

  const handleChildIncrement = () => {
    if (childCount < 5) {
      dispatch(setChildCount(childCount + 1));
    }
  };

  const handleChildDecrement = () => {
    if (childCount > 0) {
      dispatch(setChildCount(childCount - 1));
    }
  };

  const handleInfantIncrement = () => {
    if (infantCount < 5) {
      dispatch(setInfantCount(infantCount + 1));
    }
  };

  const handleInfantDecrement = () => {
    if (infantCount > 0) {
      dispatch(setInfantCount(infantCount - 1));
    }
  };

  const handlePetsIncrement = () => {
    if (petsCount < 5) {
      dispatch(setPetsCount(petsCount + 1));
    }
  };

  const handlePetsDecrement = () => {
    if (petsCount > 0) {
      dispatch(setPetsCount(petsCount - 1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-medium">Guests</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="space-y-0 divide-y divide-gray-200">
            <GuestCounter
              title="Adults"
              subtitle="Ages 13 or above"
              count={adultCount}
              onIncrement={handleAdultIncrement}
              onDecrement={handleAdultDecrement}
              minValue={1}
              maxValue={16}
            />
            
            <GuestCounter
              title="Children"
              subtitle="Ages 2–12"
              count={childCount}
              onIncrement={handleChildIncrement}
              onDecrement={handleChildDecrement}
              minValue={0}
              maxValue={5}
            />
            
            <GuestCounter
              title="Infants"
              subtitle="Under 2"
              count={infantCount}
              onIncrement={handleInfantIncrement}
              onDecrement={handleInfantDecrement}
              minValue={0}
              maxValue={5}
            />
            
            <GuestCounter
              title="Pets"
              subtitle="Bringing a service animal?"
              count={petsCount}
              onIncrement={handlePetsIncrement}
              onDecrement={handlePetsDecrement}
              minValue={0}
              maxValue={5}
            />
          </div>
          
          {/* Info text */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              This place has a maximum of 8 guests, not including infants. Pets aren't allowed.
            </p>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGuestModal;