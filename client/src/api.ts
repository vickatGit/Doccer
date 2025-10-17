import axios, { AxiosInstance } from "axios";
import { useNavigate } from "react-router-dom";
const env = import.meta.env.VITE_ENV;
const devBaseurl = import.meta.env.VITE_DEV_BASE_URL;
const prodBaseurl = import.meta.env.VITE_PROD_BASE_URL;

export let docApi: AxiosInstance | any = null;
export const setupDocApi = (authToken: string | undefined | null) => {
  if (!authToken) return;

  docApi = axios.create({
    baseURL: env === "dev" ? devBaseurl : prodBaseurl,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  // Add response interceptor
  docApi.interceptors.response.use(
    (response: any) => response,
    (error: any) => {
      console.log("error occurred");
      if (
        error.response &&
        error.response.status === 404 &&
        error.response.data?.message === "Login Failed"
      ) {
        localStorage.removeItem("authToken");
        window.location.href = "/"; // redirect to login page
      }
      return Promise.reject(error);
    }
  );

  return docApi;
};

setupDocApi(localStorage.getItem("authToken"));

export const getUserDetails = async () => {
  const data = await docApi.get("/api/auth/details");
  return data;
};

export interface GetChatsParams {
  cursor?: string | null; // ISO date string
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface ChatDTO {
  _id: string;
  name?: string;
  file?: string | null;
  lastMessage?: string;
  lastAnswer?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetChatsResponse {
  chats: ChatDTO[];
  nextCursor: string | null;
}

export async function getChats(
  params: GetChatsParams
): Promise<GetChatsResponse> {
  console.log("params :", params);
  const { data } = await docApi.get("/api/chat/search", {
    params,
  });
  return data;
}
export const createChat = async () => {
  const data = await docApi.post("/api/chat/");
  return data;
};

export const getMessages = async (
  chatId: string,
  limit: number,
  cursor?: string
) => {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) params.append("cursor", cursor);

  const { data } = await docApi.get(`/api/chat/message/${chatId}?${params}`);
  return data; // { messages, nextCursor, hasMore }
};

export const getAnswer = async (
  chatId: string,
  question: string,
  onChunk: (chunk: string) => void,
  onDone: (isDone: boolean) => void
) => {
  const res = await fetch(
    `${
      env === "dev" ? devBaseurl : prodBaseurl
    }/api/chat/message/ask/${chatId}`,

    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    }
  );
  if (!res.ok || !res.body) {
    throw new Error("Stream failed");
  }
  const stream = res.body.pipeThrough(new TextDecoderStream());
  const reader = stream.getReader();
  let isDone = false;
  while (!isDone) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      const lines = value
        .split("\n")
        .filter((line) => line.startsWith("data: "))
        .map((line) => line.replace("data: ", "").trim());

      for (const line of lines) {
        if (line) onChunk(line);
      }
    }
    isDone = done;
  }
  onDone(true);
};
