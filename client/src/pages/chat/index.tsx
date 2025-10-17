import { getUserDetails } from "@/api";
import AppSidebar from "@/pages/chat/components/AppSidebar";
import ChatPage from "@/pages/chat/components/ChatPage";
import Chats from "@/pages/chat/components/Chats";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppDispatch, RootState } from "@/store";
import { setUser } from "@/store/reducers/auth";
import { setSelectedChat } from "@/store/reducers/chat";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const index = () => {
  const dispatch = useDispatch<AppDispatch>();
  const chatState = useSelector((state: RootState) => state.chatReducer);
  const navigate = useNavigate();
  const getDetails = async () => {
    const data = await getUserDetails();
    dispatch(
      setUser({
        ...data.data,
      })
    );
  };
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (authToken && authToken.trim()) {
      getDetails();
    } else {
      navigate("/");
    }
  }, []);

  useEffect(() => {
    if (chatState.selectedChat?._id?.trim()) {
      localStorage.setItem("chatId", chatState.selectedChat?._id);
    }
  }, [chatState.selectedChat]);
  useEffect(() => {
    const selectedChatId = localStorage.getItem("chatId");
    if (selectedChatId && selectedChatId !== "undefined" && chatState.chats) {
      const selectedChat = chatState.chats.find(
        (chat) => chat._id === selectedChatId
      );
      if (
        selectedChat?._id?.trim() &&
        chatState?.selectedChat?._id !== selectedChat?._id
      ) {
        dispatch(setSelectedChat(selectedChat));
      }
    }
  }, [chatState.chats]);
  return (
    <SidebarProvider
      open={false}
      style={
        {
          "--sidebar-width-icon": "3.5rem",
        } as any
      }
    >
      <AppSidebar />
      <main className="flex w-full h-screen overflow-scroll bg-gradient-to-b from-[#EBE5F0] to-[#E7E7E7]  ">
        <Chats />
        {chatState.selectedChat && <ChatPage />}
      </main>
    </SidebarProvider>
  );
};

export default index;
