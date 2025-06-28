import { createSlice } from "@reduxjs/toolkit";
interface IInitialState {
  user: {
    name: string;
    img: string;
    email: string;
    _id: string;
    type: string;
  } | null;
}
const initialState: IInitialState = {
  user: null,
};
const authSlice = createSlice({
  name: "Auth",
  initialState: initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
});

export const { setUser } = authSlice.actions;

export default authSlice.reducer;
