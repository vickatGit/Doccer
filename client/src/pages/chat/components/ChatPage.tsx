import aiAvatar from "@/assets/mid_age_ai_sqr.jpg";
import { AppDispatch, RootState } from "@/store";
import { setChats } from "@/store/reducers/chat";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { subscribeToRoom, unsubscribeFromRoom } from "../../../config/ably";
import { useChatPagination } from "../hooks/useChatPagination";
import FriendMessage from "./FriendMessage";
import DocumentsIcon from "@/assets/documents.png";
import Input from "./Input";
import StreamMessage from "./StreamMessage";
import UserMessage from "./UserMessage";
import star from "@/assets/stars.png";
import { XMarkIcon } from "@heroicons/react/24/outline";
import FilePanel from "./FIlePanel";

const ChatPage = () => {
  const chatState = useSelector((state: RootState) => state.chatReducer);
  const dispatch = useDispatch<AppDispatch>();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isUserNearBottomRef = useRef(true);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const [responseStream, setResponseStream] = useState<string | null>("");

  const { messages, isLoading, hasMore, loadOlderMessages, addMessage } =
    useChatPagination(chatState.selectedChat?._id!);

  const chatStateRef = useRef(chatState);
  useEffect(() => {
    chatStateRef.current = chatState;
  }, [chatState]);

  // const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  //   const top = e.currentTarget.scrollTop;

  //   if (top === 0 && hasMore && !isLoading) {
  //     loadOlderMessages();
  //   }
  // };

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
          onResponseStart: (payload: any) => {
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
          onFailed: (payload: any) => {
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

            <div className="absolute top-3 right-3 w-10 h-10 bg-white rounded-lg p-3 hover:bg-primary/10 cursor-pointer">
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
                <p className="text-xl">Hi, Vikas!</p>
                <p className="font-bold text-2xl">How Can I Help You ?</p>
              </div>
              <div className="flex-1"> </div>
              {/* <div className="w-[30%]  h-16  flex items-center justify-end mt-2 ">
                {attachement && (
                  <div className="relative w-full h-12 bg-secondary mx-5 mb-3 rounded-md flex gap-2 items-center px-2">
                    <div className="w-8 h-8 rounded-md bg-accent-purple  p-1.5">
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
                        // setAttachment(null);
                      }}
                    >
                      <XMarkIcon />
                    </div>
                  </div>
                )}
              </div> */}
            </div>
          </div>
        </div>
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
        <Input />
      </div>
    </div>
  );
};

export default ChatPage;
