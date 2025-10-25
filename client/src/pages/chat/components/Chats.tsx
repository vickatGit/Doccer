// src/components/Chats.tsx
import { createChat } from "@/api";
import { AppDispatch } from "@/store";
import { setSelectedChat } from "@/store/reducers/chat";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useChatList } from "../hooks/useChatsList";
import ChatNew from "./ChatNew";

const Chats: React.FC = () => {
  const { chats, isLoading, hasMore, loadMore, setSearch, search, setChats } =
    useChatList({ initialLimit: 10 });

  const dispatch = useDispatch<AppDispatch>();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const thresholdPx = 200; // start loading older chats when within 200px of bottom

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom < thresholdPx && hasMore && !isLoading) {
      loadMore();
    }
  };

  useEffect(() => {
    const c = containerRef.current;
    c?.addEventListener("scroll", handleScroll);
    return () => c?.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoading, loadMore]);

  const onCreateChat = async () => {
    try {
      const created: any = await createChat(); // server returns new chat
      // prepend it locally
      const allChats = [created.data.chat, ...(chats || [])];
      dispatch(setChats(allChats));
      dispatch(setSelectedChat(created.data.chat));
      // optionally refresh to get server data
      // refresh();
    } catch (err) {
      console.error("createChat err", err);
    }
  };

  return (
    <div className="w-[27%] h-screen relative bg-sidebar shrink-0">
      {/* <div className="absolute inset-0 bg-gradient-to-b from-[#EBE5F0] to-[#E7E7E7]"></div> */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ECE5F3] via-[#EEEDE4] to-[#EDDEE3]"></div>

      <div className="w-full flex flex-col h-screen bg-transparent absolute pt-4 ">
        <div
          className="px-4 z-100 absolute top-0 left-0 right-0 pb-10 pt-8
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
          <div className="flex w-full justify-between items-center">
            <p className="text-2xl font-medium">Chats</p>
            <div
              role="button"
              className="w-8 h-8 p-2 border rounded-md bg-white hover:bg-primary/10 cursor-pointer"
              onClick={onCreateChat}
            >
              <PlusIcon />
            </div>
          </div>

          <div className="mt-6 mx-2 border h-8 rounded-md py-1 px-2 flex gap-1 items-center bg-secondary">
            <div className="h-4 w-4">
              <MagnifyingGlassIcon />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats..."
              className="border-transparent focus:border-transparent outline-none text-xs flex-1 bg-transparent resize-none"
            />
            {/* <div className="h-4 w-4">
              <AdjustmentsHorizontalIcon />
            </div> */}
          </div>
        </div>

        <div
          className="flex-1 overflow-auto mt-5 pt-30 mx-4 "
          ref={containerRef}
        >
          {/* chat list sorted by updatedAt descending should already be from server */}
          {chats && Array.isArray(chats) && chats.length === 0 && !isLoading ? (
            <div className="p-4 text-sm text-muted">No chats yet</div>
          ) : (
            Array.isArray(chats) &&
            chats.map((chat: any) => <ChatNew chat={chat} key={chat._id} />)
          )}

          <div className="py-4 flex justify-center">
            {isLoading ? (
              <div className="text-xs">Loading...</div>
            ) : hasMore ? (
              <div className="text-xs">Scroll to load more</div>
            ) : (
              <div className="text-xs">No more chats</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chats;
