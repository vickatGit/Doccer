import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./reducers/auth";
import chatReducer from "./reducers/chat";

export const store = configureStore({
  reducer: {
    authReducer,
    chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
