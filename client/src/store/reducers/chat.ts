import { createSlice } from "@reduxjs/toolkit";

export interface IFile {
  _id: string | null; // unique identifier
  url: string; // file URL
  key: string; // S3 key or identifier
  size: number; // file size in bytes
  name: string; // file name
}

export interface IChat {
  _id: string;
  name: string;
  files: IFile[] | null;
  lastMessage: string;
  lastAnswer: string;
  userId: string;
  updatedAt: string;
  createdAt: string;
}
export interface IMessage {
  _id: string;
  msg: string;
  chat: string;
  userId: string;
  type: string;
  createdAt: string;
  updateAt: string;
}
interface IInitialState {
  chats: IChat[] | null;
  messages: IMessage[] | null;
  selectedChat: IChat | null;
  selectedPage: "Home" | "Chats" | "Saved" | "Settings" | null;
}

const initialState: IInitialState = {
  chats: null,
  messages: null,
  selectedChat: null,
  selectedPage: "Home",
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages?.push(action.payload);
    },
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
    },
    setSelectedPage: (state, action) => {
      state.selectedPage = action.payload;
    },
  },
});

export const {
  setChats,
  setMessages,
  setSelectedChat,
  setSelectedPage,
  addMessage,
} = chatSlice.actions;
export default chatSlice.reducer;
