import { createChat, getChats } from "@/api";
import { AppDispatch, RootState } from "@/store";
import { IChat, setChats } from "@/store/reducers/chat";
import {
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Chat from "./Chat";

const Chats = () => {
  const chatState = useSelector((state: RootState) => state.chatReducer);
  const dispatch = useDispatch<AppDispatch>();

  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [canFetchMore, setCanFetchMore] = useState<boolean>(true);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const LIMIT = 20; // Number of chats per page

  const getChatsPage = async (pageNumber: number) => {
    if (loading || !canFetchMore) return;
    setLoading(true);
    try {
      const res = await getChats(pageNumber, LIMIT);
      const chats = res?.data?.chats || [];

      if (pageNumber === 0) {
        // Initial fetch, replace chats
        dispatch(setChats(chats));
      } else {
        // Append chats
        dispatch(setChats([...(chatState.chats || []), ...chats]));
      }

      if (chats.length < LIMIT) {
        setCanFetchMore(false); // No more chats to fetch
      } else {
        setCanFetchMore(true);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const createChatpage = async () => {
    await createChat();
    setPage(0);
    setCanFetchMore(true);
    getChatsPage(0);
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const threshold = 0;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      threshold;

    if (isNearBottom) {
      setPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    getChatsPage(page);
  }, [page]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => {
      container?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="w-[23%] h-screen relative bg-sidebar -ml-1 shrink-0">
      <div className="w-full h-full bg-transparent absolute pt-4 px-2  ">
        <div className="flex w-full justify-between ">
          <p className="text-2xl">Chats </p>
          <div
            className="w-8 h-8 p-2 border rounded-md hover:bg-primary/10"
            onClick={createChatpage}
          >
            <PlusIcon />
          </div>
        </div>
        <div className="mt-6 mx-2 border h-8  rounded-md py-1 px-2 flex gap-1 items-center bg-secondary">
          <div className="h-4 w-4">
            <MagnifyingGlassIcon />
          </div>
          <input className="border-transparent focus:border-transparent outline-none text-xs flex-1 bg-transparent  resize-none"></input>
          <div className="h-4 w-4">
            <AdjustmentsHorizontalIcon />
          </div>
        </div>
        <div
          className="flex-1  mt-5 overflow-scroll  "
          ref={scrollContainerRef}
        >
          {/* <DateDivider key={} /> */}
          {chatState?.chats?.map((chat: IChat) => (
            <Chat chat={chat} key={chat._id} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chats;
