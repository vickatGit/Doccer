import { docApi } from "@/api";
import aiAvatar from "@/assets/mid_age_ai_sqr.jpg";
import star from "@/assets/stars.png";
import { checkType, getFileSizeMB, maxSize, rerieveFileInfos } from "@/helpers";
import { AppDispatch, RootState } from "@/store";
import { setChats, setSelectedChat } from "@/store/reducers/chat";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { subscribeToRoom, unsubscribeFromRoom } from "../../../config/ably";
import { useChatPagination } from "../hooks/useChatPagination";
import FilePanel from "./FIlePanel";
import FileUpload from "./FileUpload";
import FriendMessage from "./FriendMessage";
import Input from "./Input";
import StreamMessage from "./StreamMessage";
import UserMessage from "./UserMessage";

const ChatPage = () => {
  const navigate = useNavigate();
  const { chatId } = useParams();
  const chatState = useSelector((state: RootState) => state.chatReducer);
  const authState = useSelector((state: RootState) => state.authReducer);
  const dispatch = useDispatch<AppDispatch>();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isUserNearBottomRef = useRef(true);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const [responseStream, setResponseStream] = useState<string | null>("");
  const { messages, isLoading, hasMore, loadOlderMessages, addMessage } =
    useChatPagination(chatState.selectedChat?._id!);
  const [open, setOpen] = useState(false);
  const chatStateRef = useRef(chatState);

  const [attachements, setAttachments] = useState<File[] | null>();
  const [fileInfos, setFileInfos] = useState<any[] | null>();
  const doesFileExist =
    open || (chatState.selectedChat?.files?.length || 0) <= 0;

  useEffect(() => {
    console.log(
      "open changed : ",
      open,
      open || (chatState.selectedChat?.files?.length || 0) <= 0
    );
  }, [open]);

  useEffect(() => {
    console.log("param chatId : ", chatId);
    const chat = chatState.chats?.find((chat) => chat._id === chatId);
    if (chat) dispatch(setSelectedChat(chat));
    else navigate("/chat");
  }, [chatId]);

  const fetchFileInfos = async () => {
    if (!attachements || attachements.length === 0) return;

    const infos = await Promise.all(
      Array.from(attachements).map((file: File) => rerieveFileInfos(file))
    );

    console.log("All file infos:", infos);
    // You can set state here if you want to store all file info
    setFileInfos(infos);
  };
  useEffect(() => {
    fetchFileInfos();
  }, [attachements]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileChange triggered");
    const files = e.target.files;

    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }

    console.log(`Total files selected: ${files.length}`);
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(
        `\nProcessing file ${i + 1} of ${files.length}: ${file.name}`
      );
      console.log(`- File size: ${file.size} bytes`);
      console.log(`- File type: ${file.type}`);

      // Check type
      if (!checkType(file)) {
        console.log(`❌ ${file.name} failed type validation`);
        continue;
      } else {
        console.log(`✅ ${file.name} passed type validation`);
      }

      // Check size
      if (maxSize && getFileSizeMB(file.size) > maxSize) {
        console.log(
          `❌ ${file.name} failed size validation (${getFileSizeMB(
            file.size
          ).toFixed(2)} MB)`
        );
        continue;
      } else if (maxSize) {
        console.log(
          `✅ ${file.name} passed size validation (${getFileSizeMB(
            file.size
          ).toFixed(2)} MB)`
        );
      }

      validFiles.push(file);
      console.log(`➡️ ${file.name} added to validFiles`);
    }

    if (validFiles.length === 0) {
      console.log("No valid files to upload");
    } else {
      console.log(`Total valid files: ${validFiles.length}`);
      validFiles.forEach((f, idx) => console.log(`- ${idx + 1}: ${f.name}`));
      setAttachments(validFiles);
    }

    // Clear input AFTER processing
    e.target.value = "";
    console.log("File input cleared");
  };

  const uploadFile = async () => {
    if (!attachements || attachements.length === 0) {
      console.log("No files to upload");
      return;
    }

    const formData = new FormData();

    // Append each file individually
    attachements?.forEach((file) => {
      formData.append("files", file); // use "files" if backend expects multiple
      console.log(`Appending file: ${file.name}`);
    });

    try {
      await docApi.post(
        `/api/chat/upload/${(chatState.selectedChat as any)._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Files uploaded successfully");
      setFileInfos(null);
      setAttachments(null);
      navigate(0);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  useEffect(() => {
    chatStateRef.current = chatState;
  }, [chatState]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = el;

    // Handle pagination
    if (scrollTop === 0 && hasMore && !isLoading) {
      const prevScrollHeight = scrollHeight;
      loadOlderMessages().then(() => {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight - prevScrollHeight;
        });
      });
    }

    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    isUserNearBottomRef.current = distanceFromBottom < 150;
  };

  // Waits until container has rendered messages fully
  const scrollToBottom = () => {
    const container = messagesRef.current;
    if (!container) return;

    const tryScroll = (attempt = 0) => {
      // Avoid infinite loops if something's wrong
      if (attempt > 10) return;

      requestAnimationFrame(() => {
        // Wait for DOM height to grow
        if (container.scrollHeight > 0) {
          container.scrollTop = container.scrollHeight;
        } else {
          // Retry shortly if height not ready
          setTimeout(() => tryScroll(attempt + 1), 50);
        }
      });
    };

    tryScroll();
  };

  useEffect(() => {
    if (chatState.selectedChat?._id) {
      try {
        subscribeToRoom(chatState.selectedChat?._id, {
          onResponseStart: () => {
            console.log("room : onResponseStart");
            // showThinkingAnimation();
          },
          onStream: (payload: any) => {
            console.log("room : onStream");
            setResponseStream((prev) => (prev += payload.chunk));
            // appendStreamChunk(payload.chunk);
            // bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
            if (isUserNearBottomRef.current) {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }
          },
          onDone: (payload: any) => {
            console.log("room : onDone", payload);
            const updateChats = (answer: string) => {
              const chats = chatStateRef.current.chats?.map((c) => {
                const chat = { ...c };
                if (chat._id === chatState.selectedChat?._id) {
                  if (answer) {
                    chat.lastAnswer = answer;
                  }
                }
                return chat;
              });
              dispatch(setChats(chats));
            };
            setResponseStream(null);
            addMessage(payload.final);
            updateChats(payload?.final?.msg);
          },
          onFailed: () => {
            console.log("room : onFailed");
            // showError(payload.error);
            setResponseStream(null);
          },
        });
      } catch (error) {
        console.log("error : ", error);
      }
    }
    return () => {
      if (chatState.selectedChat?._id) {
        try {
          unsubscribeFromRoom(chatState.selectedChat?._id);
        } catch (error) {
          console.log("error : ", error);
        }
      }
      setResponseStream(null);
    };
  }, [chatState.selectedChat?._id]);

  useEffect(() => {
    if (messages?.length > 0) {
      scrollToBottom();
    }
  }, [chatState.selectedChat?._id, messages?.length]);

  return (
    <div className="relative p-2 w-full h-screen">
      {chatState.selectedChat && (
        <div className="rounded-[2rem] overflow-hidden w-full h-full flex flex-col flex-1 overflow-y-auto px-5  [background-image:linear-gradient(to_bottom,#F4F0F8,#F4F0F8,#F3F5ED,#F9EDF1,#F9EDF1)]">
          <div
            className="px-4 z-20 absolute rounded-[2rem] top-2 left-2 right-2 pt-2
             backdrop-blur-lg
             bg-gradient-to-b from-white/20 via-white/10 to-transparent
             shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
            style={{
              WebkitMaskImage:
                "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
              maskImage:
                "linear-gradient(to bottom, black 0%, black 85%, transparent 100%)",
            }}
          >
            <div className="w-full mt-1 flex justify-center ">
              {(!messages || messages.length === 0) && (
                <div className="w-10 h-10 bg-white rounded-lg p-2">
                  <img src={star}></img>
                </div>
              )}
              <div className="flex-1" />
              {(!messages || messages.length === 0) && (
                <p className="text-[1.5rem] font-medium">New Chat</p>
              )}

              <div className="flex-1" />

              <div
                className="absolute top-3 right-3 w-10 h-10 bg-white rounded-lg p-3 hover:bg-primary/10 cursor-pointer"
                onClick={() => {
                  dispatch(setSelectedChat(null));
                  navigate("/chat");
                }}
              >
                <XMarkIcon />
              </div>
            </div>
            <div className="w-full z-20 mt-3 pb-10">
              <div className="flex items-center gap-2">
                <div className="overflow-hidden rounded-full h-22 w-22 shrink-0">
                  <img
                    src={aiAvatar}
                    className="h-full w-full object-cover"
                  ></img>
                </div>
                <div className="flex flex-col">
                  <p className="text-xl">Hi, {authState.user?.name}!</p>
                  <p className="font-bold text-2xl">{`${
                    chatState.selectedChat?.files?.length || 0 > 0
                      ? "How Can I Help You ?"
                      : "Upload File to Start the Chat"
                  } `}</p>
                </div>
                <div className="flex-1"> </div>
              </div>
            </div>
          </div>
          {doesFileExist && (
            <div className="flex items-center justify-center absolute w-[90%] h-[97%]">
              <div className="w-full max-w-[25rem] h-[20rem] flex items-center justify-center">
                <FileUpload
                  onFileChange={handleFileChange}
                  fileInfos={fileInfos}
                  uploadFile={uploadFile}
                  setOpen={setOpen}
                />
              </div>
            </div>
          )}
          {!doesFileExist && (
            <div className="flex w-full h-full gap-10 cursor-pointer">
              <div
                className="w-full h-full px-5 overflow-y-scroll flex-1 pb-40 pt-80"
                ref={messagesRef}
                onScroll={handleScroll}
              >
                {messages?.map((msg) =>
                  msg.type === "question" ? (
                    <UserMessage msg={msg} key={msg?._id} />
                  ) : (
                    <FriendMessage msg={msg} key={msg?._id} />
                  )
                )}
                {responseStream != null && responseStream != "" && (
                  <StreamMessage msg={responseStream} key={"response-stream"} />
                )}
                <div ref={bottomRef} key={"tracker"} />
              </div>
              {!chatState.selectedChat?.files ||
                (chatState.selectedChat?.files?.length !== 0 && (
                  <div className="flex flex-col justify-center">
                    <FilePanel files={chatState.selectedChat?.files} />
                  </div>
                ))}
            </div>
          )}
          {!doesFileExist && (
            <Input
              attachements={attachements}
              fileInfos={fileInfos}
              setFileInfos={setFileInfos}
              handleFileChange={handleFileChange}
              uploadFile={uploadFile}
              setOpen={setOpen}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatPage;
