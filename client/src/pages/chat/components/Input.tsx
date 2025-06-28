import { docApi, getAnswer } from "@/api";
import { checkType, getFileSizeMB, maxSize } from "@/helpers";
import { AppDispatch, RootState } from "@/store";
import { addMessage, IMessage, setChats } from "@/store/reducers/chat";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";

const Input = () => {
  const [attachement, setAttachment] = useState<File | null>();
  const chatState = useSelector((state: RootState) => state.chatReducer);
  const userState = useSelector((state: RootState) => state.authReducer);
  const dispatch = useDispatch<AppDispatch>();
  const [question, setQuestion] = useState<string>("");
  const [stream, setStream] = useState<string>("");
  const streamRef = useRef("");
  const streamInterval = useRef<NodeJS.Timeout | null>(null);

  const startStreaming = () => {
    if (!streamInterval.current) {
      streamInterval.current = setInterval(() => {
        stream;
        setStream(streamRef.current);
      }, 100); // Adjust if needed
    }
  };

  const stopStreaming = () => {
    if (streamInterval.current) {
      clearInterval(streamInterval.current);
      streamInterval.current = null;
    }
  };

  const onStream = (chunk: string) => {
    if (!streamInterval.current) startStreaming();
    streamRef.current += chunk + " ";
  };
  const onStreamDone = (isDone: boolean) => {
    if (isDone) {
      if (!streamInterval.current) stopStreaming();
      const finalText = streamRef.current;
      updateChats(question, finalText, "answer");
      setStream(""); // Clear state
      streamRef.current = "";
    }
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
    dispatch(addMessage(message));
    dispatch(setChats(chats));
    setQuestion("");
  };
  const submitQuestion = async () => {
    updateChats(question, "...", "question");
    if (attachement) {
      await uploadFile();
    }
    if (chatState.selectedChat) {
      await getAnswer(
        chatState.selectedChat?._id?.toString(),
        question,
        onStream,
        onStreamDone
      );
    }
  };
  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", attachement!);
    await docApi.post(
      `/api/chat/upload/${(chatState.selectedChat as any)._id}`,
      formData,
      {
        headers: {
          "Content-type": "multipart/form-data",
        },
      }
    );
    setAttachment(null);
  };
  const handleFileChange = async (e: any) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!checkType(file)) {
      return;
    }

    if (maxSize && getFileSizeMB(file) > maxSize) {
      return;
    }
    setAttachment(file);
  };

  const doesFileExist = attachement || chatState.selectedChat?.file;

  return (
    <div className="h-fit  pb-11 shrink-0 px-28 bg-transparent">
      <div className="relative flex flex-col flex-1 py-4  border-[0.1rem] rounded-[0.55rem] mt-4">
        {attachement && (
          <div className="relative w-[30%]  h-12 bg-secondary mx-5 mb-3 rounded-md flex gap-2 items-center px-2">
            <div className="w-8 h-8 rounded-md bg-[#FF3001] p-1.5">
              <DocumentIcon />
            </div>
            <div className="flex flex-col   w-full overflow-hidden">
              <p className="text-[0.8rem] break-all text-ellipsis line-clamp-1">
                {attachement.name}
              </p>
              <p className="text-[0.6rem]">PDF</p>
            </div>
            <div
              className="absolute h-3 w-3 rounded-full bg-red-400 p-[0.1rem] -top-1 -right-1 overflow-hidden cursor-pointer"
              onClick={() => {
                setAttachment(null);
              }}
            >
              <XMarkIcon />
            </div>
          </div>
        )}

        <div className="flex w-full h-full items-center px-3 gap-2 ">
          {!(chatState.selectedChat as any)?.file ? (
            <div className="relative shrink-0 w-8 h-8 cursor-pointer rounded-md p-2 ">
              <ArrowUpTrayIcon className="cursor-pointer" />
              <input
                type="file"
                autoComplete="off"
                onChange={handleFileChange}
                multiple
                className="absolute top-0 w-full h-full opacity-0  cursor-pointer z-40"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-md bg-accent-purple  p-1.5">
              <DocumentIcon />
            </div>
          )}

          <textarea
            rows={1}
            className="border-transparent focus:border-transparent outline-none text-sm flex-1 bg-transparent  resize-none"
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
            placeholder={`Send a message...`}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div
            className={`${
              doesFileExist ? "cursor-pointer" : "cursor-not-allowed"
            } flex-shrink-0 w-5 h-5 ${
              doesFileExist ? "text-primary" : "text-primary/30"
            } `}
            onClick={() => {
              {
                doesFileExist && submitQuestion();
              }
            }}
          >
            <PaperAirplaneIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Input;
