// src/hooks/useChatList.ts
import { RootState } from "@/store";
import { setChats } from "@/store/reducers/chat";
import debounce from "lodash.debounce";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getChats, GetChatsParams } from "../../../api";

export type DateRange = { start?: string; end?: string } | null;

export function useChatList(options?: { initialLimit?: number }) {
  const LIMIT = options?.initialLimit ?? 20;

  // ──────────── STATES ─────────────
  const chatState = useSelector((state: RootState) => state.chatReducer);
  const dispatch = useDispatch();
  // const [chats, setChats] = useState<ChatDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>(null);

  // ──────────── REFS ─────────────
  const searchRef = useRef(search);
  const dateRangeRef = useRef(dateRange);
  const lastRequestRef = useRef<string | null>(null);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    dateRangeRef.current = dateRange;
  }, [dateRange]);

  // ──────────── BUILD PARAMS ─────────────
  interface BuildParamsOptions {
    cursor?: string | null;
    search?: string;
    startDate?: string;
    endDate?: string;
  }

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

  // ──────────── FETCH PAGE ─────────────
  // ⚡ NOTE: This does NOT depend on `search` or `dateRange` directly.
  const fetchPage = async (cursor: string | null, append = true) => {
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
      if (lastRequestRef.current !== requestKey) return; // Ignore outdated response
      const buildChats = () => {
        const existingIds = new Set(
          append ? chatState?.chats?.map((c) => c._id) : []
        );
        const newItems = res.chats.filter((c) => !existingIds.has(c._id));
        return append ? [...(chatState?.chats || []), ...newItems] : newItems;
      };
      dispatch(setChats(buildChats()));

      setNextCursor(res.nextCursor ?? null);
      setHasMore(Boolean(res.nextCursor));
    } catch (err) {
      console.error("fetchPage error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ──────────── REFRESH ─────────────
  const refresh = async () => {
    setIsRefreshing(true);
    await fetchPage(null, false);
    setIsRefreshing(false);
  };

  // ──────────── LOAD MORE ─────────────
  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    await fetchPage(nextCursor, true);
  };

  // ──────────── DEBOUNCED SEARCH/FILTER REFRESH ─────────────
  const debouncedRefresh = useRef(
    debounce(() => {
      refresh();
    }, 400)
  ).current;

  // ──────────── INITIAL LOAD ─────────────
  useEffect(() => {
    refresh();
    return () => {
      debouncedRefresh.cancel();
    };
  }, []); // runs once on mount

  // ──────────── FILTER CHANGES ─────────────
  useEffect(() => {
    debouncedRefresh();
  }, [search, dateRange]);

  // ──────────── RETURN API ─────────────
  return {
    chats: chatState.chats,
    isLoading,
    isRefreshing,
    hasMore,
    loadMore,
    refresh,
    search,
    setSearch,
    dateRange,
    setDateRange,
    setChats,
  };
}
