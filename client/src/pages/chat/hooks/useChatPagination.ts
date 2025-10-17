import { getMessages } from "@/api";
import { IMessage } from "@/store/reducers/chat";
import { useEffect, useState, useCallback } from "react";

interface UseChatPaginationResult {
  messages: IMessage[];
  isLoading: boolean;
  hasMore: boolean;
  loadOlderMessages: () => Promise<void>;
}

export const useChatPagination = (
  chatId: string,
  limit: number = 10
): UseChatPaginationResult => {
  const [messages, setMessages] = useState<IMessage[]>([]);
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
        setMessages(messages);
        setOldestCursor(nextCursor);
        setHasMore(hasMore);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [chatId, limit]);

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
        setMessages((prev) => [...olderMessages, ...prev]);
        setOldestCursor(nextCursor);
        setHasMore(more);
      } else {
        setHasMore(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [chatId, limit, oldestCursor, hasMore, isLoading]);

  return { messages, isLoading, hasMore, loadOlderMessages };
};
