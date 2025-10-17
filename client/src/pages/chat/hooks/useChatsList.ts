// src/hooks/useChatList.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { GetChatsParams, ChatDTO, getChats } from "../../../api";
import debounce from "lodash.debounce";

export type DateRange = { start?: string; end?: string } | null;

export function useChatList(options?: { initialLimit?: number }) {
  const LIMIT = options?.initialLimit ?? 20;

  const [chats, setChats] = useState<ChatDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>(null);

  const searchRef = useRef(search);
  const dateRangeRef = useRef(dateRange);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    dateRangeRef.current = dateRange;
  }, [dateRange]);

  // track current request params to avoid race conditions
  const lastRequestRef = useRef<string | null>(null);

  const buildParams = ({
    cursor,
    search,
    startDate,
    endDate,
  }: BuildParamsOptions) => {
    const params: GetChatsParams = { limit: LIMIT };

    if (cursor) params.cursor = cursor;
    if (search && search.trim()) params.search = search.trim();
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return params;
  };

  interface BuildParamsOptions {
    cursor?: string | null;
    search?: string;
    startDate?: string;
    endDate?: string;
    // add other filters here if needed
  }

  const fetchPage = useCallback(
    async (cursor: string | null, append = true) => {
      const params = buildParams({
        cursor,
        search: searchRef.current,
        startDate: dateRangeRef.current?.start,
        endDate: dateRangeRef.current?.end,
      });

      const requestKey = JSON.stringify(params);
      lastRequestRef.current = requestKey;
      setIsLoading(true);

      try {
        const res = await getChats(params);

        // Ignore if superseded
        if (lastRequestRef.current !== requestKey) return;

        // Deduplicate chats safely
        setChats((prev) => {
          const existingIds = new Set(append ? prev.map((c) => c._id) : []);
          const newItems = res.chats.filter((c) => !existingIds.has(c._id));
          return append ? [...prev, ...newItems] : newItems;
        });

        setNextCursor(res.nextCursor);
        setHasMore(Boolean(res.nextCursor));
      } catch (err) {
        console.error("fetchPage error", err);
      } finally {
        setIsLoading(false);
      }
    },
    [LIMIT] // only include constants; refs give latest filter values
  );

  // Refresh (fetch first page and replace)
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPage(null, false);
    setIsRefreshing(false);
  }, [fetchPage]);

  // Load more older chats using nextCursor
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchPage(nextCursor, true);
  }, [fetchPage, hasMore, isLoading, nextCursor]);

  // Debounced search -> triggers refresh
  // 400ms is a typical debounce for server-side search
  const debouncedRefresh = useRef(
    debounce(() => {
      refresh();
    }, 400)
  ).current;

  useEffect(() => {
    // initial load
    refresh();
    // cleanup debounced on unmount
    return () => {
      debouncedRefresh.cancel();
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    // when search or dateRange change, do debounced refresh
    debouncedRefresh();
  }, [search, dateRange, debouncedRefresh]);

  return {
    chats,
    isLoading,
    isRefreshing,
    hasMore,
    loadMore,
    refresh,
    setSearch,
    search,
    setDateRange,
    dateRange,
    setChats, // expose setter in case caller wants to prepend updated chat (socket)
  };
}
