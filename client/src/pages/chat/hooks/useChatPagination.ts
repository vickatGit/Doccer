import { getMessages } from "@/api";
import { AppDispatch, RootState } from "@/store";
import {
  addMessage as addMessaeToState,
  IMessage,
  setMessages,
} from "@/store/reducers/chat";
import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";

interface UseChatPaginationResult {
  messages: IMessage[];
  isLoading: boolean;
  hasMore: boolean;
  loadOlderMessages: () => Promise<void>;
  addMessage: (msg: IMessage) => void;
}

export const useChatPagination = (
  chatId: string,
  limit: number = 10
): UseChatPaginationResult => {
  // const [messages, setMessages] = useState<IMessage[]>([]);
  const dispatch = useDispatch<AppDispatch>();
  const messageState = useSelector((state: RootState) => state.chatReducer);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [oldestCursor, setOldestCursor] = useState<string | null>(null);

  // Fetch initial messages
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { messages, nextCursor, hasMore } = await getMessages(
          chatId,
          limit
        );
        dispatch(setMessages(messages));
        // setMessages(messages);
        setOldestCursor(nextCursor);
        setHasMore(hasMore);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [chatId, limit]);
  const addMessage = (msg: IMessage) => {
    dispatch(addMessaeToState(msg));
  };

  // Fetch older messages (when scrolled to top)
  const loadOlderMessages = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    try {
      const {
        messages: olderMessages,
        nextCursor,
        hasMore: more,
      } = await getMessages(chatId, limit, oldestCursor || undefined);

      if (olderMessages.length > 0) {
        // setMessages((prev) => [...olderMessages, ...(messageState.messages || [])]);
        dispatch(
          setMessages([...olderMessages, ...(messageState.messages || [])])
        );
        setOldestCursor(nextCursor);
        setHasMore(more);
      } else {
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [chatId, limit, oldestCursor, hasMore, isLoading]);

  return {
    messages: messageState.messages!,
    isLoading,
    hasMore,
    loadOlderMessages,
    addMessage,
  };
};
