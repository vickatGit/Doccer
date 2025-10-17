import React from "react";
import placeholder from "../../../assets/image-placeholder.png";
import { Document, Page, pdfjs } from "react-pdf";
import PdfThumb from "./PdfThumb";
import { IChat, setSelectedChat } from "@/store/reducers/chat";
import { formatDateWithLabels } from "@/helpers";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";

type Props = {
  chat: IChat;
};
const ChatNew: React.FC<Props> = ({ chat }) => {
  const dispatch = useDispatch<AppDispatch>();
  return (
    <div
      className={`rounded-3xl w-full overflow-hidden  mt-2 bg-gradient-to-b from-[#D3C9DC] via-[#D3C9DC] to-[#C4DCAB]  `}
    >
      <div className="flex justify-between p-3 items-center ">
        <div className="flex">
          <div className="w-8 h-8 rounded-full p-2 bg-[#EEEBF1]">
            <img src={placeholder} />
          </div>
          <div className="flex flex-col ml-2">
            <p className="text-[0.75rem] font-medium w-full break-all text-ellipsis line-clamp-1">
              {chat.file?.name || "Ai Search"}
            </p>
            <div className="flex text-[#5D5661] text-[0.6rem] font-medium items-center gap-2">
              {formatDateWithLabels(new Date(Date.parse(chat.updatedAt)))}
              <p>Today</p>
              {chat?.createdAt && (
                <div className="w-[0.3rem] h-[0.3rem] h-1 rounded-full bg-[#5D5661]"></div>
              )}

              <p>
                {chat?.createdAt
                  ? formatDateWithLabels(new Date(Date.parse(chat?.createdAt)))
                  : ""}
              </p>
            </div>
          </div>
        </div>
        <div
          className="w-8 h-8 rounded-full p-2 bg-[#EEEBF1] cursor-pointer flex justify-center items-center"
          onClick={() => {
            if (chat._id?.trim()) {
              dispatch(setSelectedChat(chat));
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="3"
            stroke="currentColor"
            className="size-3"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
            />
          </svg>
        </div>
      </div>
      <div
        className={`relative rounded-2xl overflow-hidden mx-1 ${
          chat.file?.url ? "h-45" : "h-fit"
        }`}
      >
        {chat?.file?.url && <PdfThumb fileUrl={chat.file.url} />}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent   to-[#C4DCAB]   "></div>
        <div className="absolute bottom-1 flex items-center  left-2 right-2  bg-[#DDEACF] h-12  rounded-3xl">
          <div className="w-8 h-8 shrink-0 rounded-full p-2 ml-2 ">
            <img src={placeholder} />
          </div>
          <div className="flex flex-col ml-2">
            <p className="text-[0.75rem] font-medium">{chat.lastMessage}</p>
            <div className="flex text-[#5D5661] text-[0.6rem] font-medium items-center gap-2 mr-2.5 ">
              <p className="break-all text-ellipsis line-clamp-1">
                {chat?.lastAnswer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatNew;
