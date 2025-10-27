import star from "@/assets/stars.png";
import {
  extractFirstFiveLinesFromS3,
  formatDateWithLabels,
  getFileExtenstion,
  getFileLogo,
} from "@/helpers";
import { RootState } from "@/store";
import { IChat } from "@/store/reducers/chat";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom";
import FileCard from "./FileCard";

type Props = {
  chat: IChat;
};
const ChatNew: React.FC<Props> = ({ chat }) => {
  const isMobile = useMediaQuery({ maxWidth: 600 });
  const isIpad = useMediaQuery({ maxWidth: 1250 });
  const chatState = useSelector((state: RootState) => state.chatReducer);
  const [files, setFiles] = useState<any[]>();
  const navigate = useNavigate();

  useEffect(() => {
    const processFiles = async () => {
      if (!chat.files || chat.files.length === 0) return;
      const files = [];
      for (const file of chat.files) {
        try {
          const firstFiveLines = (
            await extractFirstFiveLinesFromS3(file.url)
          ).join(" ");
          const info = {
            name: file.name,
            logo: getFileLogo(getFileExtenstion(file.name)),
            firstFiveLines,
          };
          files.push(info);
          console.log("File Info:", info);
        } catch (err) {
          console.error("Error processing file:", file.name, err);
        }
      }
      setFiles(files);
    };

    processFiles();
  }, [chat]);

  return (
    <div
      // className={`rounded-3xl w-full overflow-hidden  mt-2  bg-gradient-to-b from-[#E4E4E4] via-[#E4E4E4] to-[#c3dca8]  `}
      className={`rounded-3xl  w-full max-w-[22rem] h-fit overflow-hidden  mt-4 border border-white/20
               bg-white/30 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.05)]`}
      // className={`rounded-3xl w-full overflow-hidden  mt-2  `}
    >
      <div className="flex justify-between p-3 items-center">
        <div className="flex">
          <div className="w-8 h-8 rounded-full p-2 bg-[#EEEBF1]">
            <img src={star}></img>
          </div>
          <div className="flex flex-col ml-2">
            <p className="text-[0.75rem] font-medium w-full break-all text-ellipsis line-clamp-1">
              {chat.name || "Ai Search"}
            </p>
            <div className="flex text-[#5D5661] text-[0.6rem] font-medium items-center gap-2">
              {(() => {
                const { day, dateString } = formatDateWithLabels(
                  new Date(Date.parse(chat.updatedAt))
                );
                return (
                  <>
                    {day && <p>{day}</p>}
                    {day && (
                      <div className="w-[0.3rem] h-[0.3rem] h-1 rounded-full bg-[#5D5661]"></div>
                    )}
                    <p>{dateString}</p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
        <div
          className={`w-8 h-8 rounded-full p-2 ${
            chatState.selectedChat?._id.toString() === chat._id.toString()
              ? "bg-primary/10"
              : "bg-[#EEEBF1]"
          }  hover:bg-primary/10 cursor-pointer flex justify-center items-center`}
          onClick={() => {
            if (chat._id?.trim()) {
              navigate(`/chat/${chat._id}`);
              // dispatch(setSelectedChat(chat));
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="3"
            stroke="currentColor"
            className="size-3 "
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
            />
          </svg>
        </div>
      </div>
      <hr></hr>
      <div className={`relative rounded-2xl overflow-hidden mx-1 h-fit`}>
        <div
          className={`flex gap-2 px-6  ${
            isIpad && !isMobile
              ? "h-50 mt-3"
              : !files || files?.length === 0
              ? "h-fit"
              : "h-50 mt-3"
          }`}
        >
          {files?.slice(0, 3)?.map((file, index) => {
            return (
              <div
                key={file.name}
                className="relative transition-transform duration-300"
                style={{
                  transform: `translateX(-${index * 40}px) rotate(${
                    index % 2 === 0 ? -4 : 4
                  }deg)`,
                  zIndex: index,
                }}
              >
                <FileCard
                  firstFiveLines={file.firstFiveLines}
                  logo={file.logo}
                  name={file.name}
                  showFade={false}
                />
              </div>
            );
          })}
        </div>
        {
          <div
            className={`bottom-1 flex items-center z-30  mb-1 left-1 right-1 ${
              isIpad && !isMobile ? "h-11" : "h-fit"
            } py-1  ${
              chat.lastMessage ? "rounded-3xl border border-white" : ""
            }`}
          >
            {chat.lastMessage && (
              <div className="w-8 h-8 shrink-0 rounded-full p-2 ml-2 bg-[#EEEBF1] z-10 ">
                <img src={star} />
              </div>
            )}
            {chat.lastMessage && (
              <div className="flex flex-col ml-2">
                <p className="text-[0.75rem] font-medium">{chat.lastMessage}</p>
                <div className="flex text-[#5D5661] text-[0.6rem] font-medium items-center gap-2 mr-2.5 ">
                  <p className="break-all text-ellipsis line-clamp-1">
                    {chat?.lastAnswer}
                  </p>
                </div>
              </div>
            )}
          </div>
        }
      </div>
    </div>
  );
};

export default ChatNew;
