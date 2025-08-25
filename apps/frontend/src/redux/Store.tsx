import { combineReducers, configureStore } from "@reduxjs/toolkit";
import formReducer from "./mainFormSlice";
import appReducer from "./AppSlice";
import HouseDetailSlice from "./HouseDetailSlice";
import filterReducer from "./filterSlice";
import bookingsReducer from "./bookingsSlice";

import CardSlice from "./CardSlice";
import {
  createStateSyncMiddleware,
  initMessageListener,
  withReduxStateSync,
} from "redux-state-sync";

const stateSyncMiddleware = createStateSyncMiddleware({
  whitelist: [
    "app/setItemId",
    "app/setIsFavorite",
    "app/removeUserFavListing",
    "app/setUserFavListing",
    "app/setUserData",
    "bookings/addBooking",
    "bookings/removeBooking",
    "bookings/updateBookingStatus",
  ],
});

export const store = configureStore({
  reducer: withReduxStateSync(
    combineReducers({
      form: formReducer,
      app: appReducer,
      houseDetail: HouseDetailSlice,
      card: CardSlice,
      filter: filterReducer,
      bookings: bookingsReducer,
    })
  ),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(stateSyncMiddleware),
});

initMessageListener(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
