import axios, { AxiosInstance } from "axios";
import Cookies from "js-cookie";
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
};

setupDocApi(Cookies.get("authToken"));

export const getUserDetails = async () => {
  const data = await docApi.get("/api/auth/details");
  return data;
};

export const getChats = async (page: number, limit: number) => {
  const data = await docApi.get(`/api/chat/search?page=${page}&limit=${limit}`);
  return data;
};
export const createChat = async () => {
  const data = await docApi.post("/api/chat/");
  return data;
};

export const getMessages = async (
  chatId: string,
  page: number,
  limit: number
) => {
  const data = await docApi.get(
    `/api/chat/message/${chatId}?page=${page}&limit=${limit}`
  );
  return data;
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
        Authorization: `Bearer ${Cookies.get("authToken")}`,
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
