import { RootState } from "@/store";
import { DocumentIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRef } from "react";
import { useSelector } from "react-redux";
import FriendMessage from "./FriendMessage";
import Input from "./Input";
import UserMessage from "./UserMessage";
import { useChatPagination } from "../hooks/useChatPagination";

const ChatPage = () => {
  const chatState = useSelector((state: RootState) => state.chatReducer);
  const attachement = chatState.selectedChat?.file;
  const chatsRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  // const canFetchMore = useRef<boolean>(true);
  // const [page, setPage] = useState<number>(0);
  // const [messages, setMessages] = useState<IMessage[]>();
  // const getChatMessages = async (
  //   chatId: string,
  //   page: number,
  //   limit: number
  // ) => {
  //   console.log("canfetchmore", canFetchMore.current);
  //   if (canFetchMore.current) {
  //     apiLoading = true;
  //     const data = await getMessages(chatId, page, limit);
  //     if ((data?.data?.chats as any).length > 0) {
  //       let msgs: any[] = [
  //         ...(data?.data?.chats || []),
  //         ...(messages?.filter(
  //           (msg) => msg._id === chatState.selectedChat?._id
  //         ) || []),
  //       ];
  //       canFetchMore.current = !(data?.data?.chats?.length < limit);
  //       setMessages(msgs);
  //     }
  //     console.log("api loading", apiLoading);
  //     apiLoading = false;
  //   }
  // };
  // useEffect(() => {
  //   if (chatState.selectedChat) {
  //     setMessages([]); // Clear previous chat messages
  //     canFetchMore.current = true;
  //     setPage(0); // Reset page

  //     getChatMessages(chatState.selectedChat._id, 0, limit);
  //   }
  //   return () => {
  //     // Cleanup to avoid memory leaks
  //     canFetchMore.current = true;
  //     setMessages([]);
  //     setPage(0);
  //   };
  // }, [chatState.selectedChat?._id]);

  // useEffect(() => {
  //   if (page > 0 && chatState.selectedChat?._id) {
  //     getChatMessages(chatState.selectedChat._id, page, limit);
  //   }
  // }, [page, chatState.selectedChat?._id]);

  // const wasAtBottomRef = useRef<boolean>(true);

  // const isUserAtBottom = () => {
  //   const container = messagesRef.current;
  //   if (!container) return false;

  //   const threshold = 50;
  //   const position =
  //     container.scrollHeight - container.scrollTop - container.clientHeight;

  //   return position <= threshold;
  // };

  // useEffect(() => {
  //   const container = messagesRef.current;
  //   if (!container) return;

  //   const handleScroll = () => {
  //     wasAtBottomRef.current = isUserAtBottom();

  //     // ✅ Pagination fetch when scrolled to top
  //     if (container.scrollTop === 0) {
  //       if (container.scrollTop === 0) {
  //         apiLoading = true;
  //         const prevScrollHeight = container.scrollHeight;

  //         setPage((prev) => prev + 1);

  //         // Wait a bit for messages to load
  //         setTimeout(() => {
  //           const newScrollHeight = container.scrollHeight;
  //           container.scrollTop = newScrollHeight - prevScrollHeight;
  //           apiLoading = false;
  //         }, 100); // adjust as needed
  //       }
  //     }
  //   };

  //   container.addEventListener("scroll", handleScroll);
  //   return () => {
  //     container.removeEventListener("scroll", handleScroll);
  //   };
  // }, [canFetchMore]);
  // useEffect(() => {
  //   if (wasAtBottomRef.current) {
  //     chatsRef?.current?.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [messages]);

  const { messages, isLoading, hasMore, loadOlderMessages } = useChatPagination(
    chatState.selectedChat?._id!
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    console.log("scrolling : ", top);

    if (top === 0 && hasMore && !isLoading) {
      loadOlderMessages();
    }
  };

  return (
    <div className="rounded-[4rem] w-full h-screen flex flex-col flex-1 overflow-y-auto px-5  [background-image:linear-gradient(to_bottom,#F9EDF1,#F6F6F6,#F6F6F6,#F6F6F6,#F9EDF1)]">
      <div className="w-full h-16  flex items-center justify-end mt-2 ">
        {attachement && (
          <div className="relative w-[30%]  h-12 bg-secondary mx-5 mb-3 rounded-md flex gap-2 items-center px-2">
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
      </div>
      <div
        className="w-full px-5 overflow-y-scroll flex-1"
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
        <div ref={chatsRef} key={"tracker"} />
      </div>
      <Input />
    </div>
  );
};

export default ChatPage;
