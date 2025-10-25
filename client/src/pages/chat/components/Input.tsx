import { getAnswer } from "@/api";
import { AppDispatch, RootState } from "@/store";
import { addMessage, IMessage, setChats } from "@/store/reducers/chat";
import {
  ArrowUpTrayIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";

type Props = {
  handleFileChange: any;
  uploadFile: any;
  attachements: File[] | null | undefined;
  setFileInfos: any;
  setOpen: any;
  fileInfos: any[] | null | undefined;
};
const Input: React.FC<Props> = ({
  handleFileChange,
  uploadFile,
  attachements,
  setOpen,
}) => {
  const chatState = useSelector((state: RootState) => state.chatReducer);
  const userState = useSelector((state: RootState) => state.authReducer);
  const dispatch = useDispatch<AppDispatch>();
  const [question, setQuestion] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = () => {
    // fileInputRef.current?.click();
    setOpen(true);
  };

  const updateChats = (
    question: string,
    answer: string,
    type: "question" | "answer"
  ) => {
    const chats = chatState.chats?.map((c) => {
      const chat = { ...c };
      if (chat._id === chatState.selectedChat?._id) {
        if (question) {
          chat.lastMessage = question;
        }
        if (answer) {
          chat.lastAnswer = answer;
        }
        console.log("got the chat : ", chat);
      }
      return chat;
    });

    const message: IMessage = {
      _id: uuidv4(),
      chat: chatState.selectedChat?._id!,
      createdAt: Date.now().toString(),
      updateAt: Date.now().toString(),
      type: type,
      msg: type === "question" ? question : answer,
      userId: userState.user?._id!,
    };
    console.log("message : ", message);
    dispatch(addMessage(message));
    dispatch(setChats(chats));
    setQuestion("");
  };
  const submitQuestion = async () => {
    console.log("updating");
    updateChats(question, "...", "question");
    if (attachements) {
      await uploadFile();
    }
    if (chatState.selectedChat) {
      await getAnswer(chatState.selectedChat?._id?.toString(), question);
    }
  };

  const doesFileExist =
    attachements || (chatState.selectedChat?.files?.length || 0) > 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-fit pb-11 shrink-0 px-28 bg-transparent">
      <div className="flex gap-4 z-100">
        {/* {fileInfos?.map((file) => {
          return (
            <FileCard
              name={file.name}
              logo={file.logo}
              firstFiveLines={file.firstFiveLines}
              showFade={true}
            />
          );
        })} */}
      </div>

      <div
        className="relative flex flex-col flex-1 py-2 border border-white/20 rounded-[2.5rem] mt-2 
               bg-white/10 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
      >
        <div className="flex w-full h-full items-center px-3 gap-2 ">
          {/* {!(chatState.selectedChat as any)?.file && ( */}

          <div
            className="relative shrink-0 w-8 h-8 rounded-md p-2 cursor-pointer"
            onClick={handleUploadClick}
          >
            <ArrowUpTrayIcon className="w-full h-full cursor-pointer" />
            <input
              type="file"
              ref={fileInputRef}
              autoComplete="off"
              onChange={handleFileChange}
              multiple
              className="absolute inset-0 w-2 h-2 opacity-0 cursor-pointer"
              style={{ zIndex: 10 }}
            />
          </div>

          <textarea
            rows={1}
            className="border-transparent focus:border-transparent outline-none text-sm flex-1 bg-transparent  resize-none pl-"
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                if (!e.shiftKey) {
                  e.preventDefault();
                  {
                    doesFileExist && submitQuestion();
                  }
                }
              }
            }}
            value={question}
            placeholder={`${
              doesFileExist
                ? "Ask me anything..."
                : "Please Upload File to Start the Chat"
            }`}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <div
            className={`bg-white w-10 h-10 flex justify-center items-center rounded-full
             ${
               doesFileExist ? "cursor-pointer" : "cursor-not-allowed"
             } flex-shrink-0 w-5 h-5 ${
              doesFileExist ? "text-primary" : "text-primary/30"
            }`}
          >
            <div
              className={`bg-white ${
                doesFileExist ? "cursor-pointer" : "cursor-not-allowed"
              } flex-shrink-0 w-5 h-5 ${
                doesFileExist ? "text-primary" : "text-primary/30"
              } `}
              onClick={() => {
                {
                  true && submitQuestion();
                }
              }}
            >
              <PaperAirplaneIcon />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Input;
