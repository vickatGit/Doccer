import { AppDispatch, RootState } from "@/store";
import { IChat, setSelectedChat } from "@/store/reducers/chat";
import React from "react";
import { useDispatch, useSelector } from "react-redux";

type Props = {
  chat: IChat;
};
const Chat: React.FC<Props> = ({ chat }) => {
  const dispatch = useDispatch<AppDispatch>();
  const chatState = useSelector((state: RootState) => state.chatReducer);
  return (
    <div
      className={`rounded-lg  ${
        chat._id === chatState?.selectedChat?._id && "bg-primary/10"
      } hover:bg-primary/10 w-full flex  gap-2 py-2 px-2 items-center mt-3`}
      onClick={() => {
        if (chat._id?.trim()) {
          dispatch(setSelectedChat(chat));
        }
      }}
    >
      <div className="w-8 h-8 bg-white rounded-full shrink-0 overflow-hidden">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEcv_WJfqB-tC3ZFADRoUMMMTtOA6ZzyAA6g&s" />
      </div>
      <div className="flex flex-col">
        <p className="text-sm break-all line-clamp-1  text-ellipsis">
          {chat?.lastMessage || chat?.name}
        </p>
        <p className="text-[0.6rem] break-all line-clamp-1  text-ellipsis">
          {chat?.lastAnswer}
        </p>
      </div>
    </div>
  );
};

export default Chat;
