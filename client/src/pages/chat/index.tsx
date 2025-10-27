import { getUserDetails } from "@/api";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/pages/chat/components/AppSidebar";
import ChatPage from "@/pages/chat/components/ChatPage";
import Chats from "@/pages/chat/components/Chats";
import { AppDispatch, RootState } from "@/store";
import { setUser } from "@/store/reducers/auth";
import { setChats } from "@/store/reducers/chat";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom";
import { initAblyForUser, subscribeToUserChannel } from "../../config/ably";
import BottomNav from "./components/BottomNav";

const index = () => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isIpad = useMediaQuery({ maxWidth: 1250 });
  const dispatch = useDispatch<AppDispatch>();
  const chatState = useSelector((state: RootState) => state.chatReducer);
  const authReducer = useSelector((state: RootState) => state.authReducer);
  const navigate = useNavigate();
  const chatStateRef = useRef(chatState);
  useEffect(() => {
    chatStateRef.current = chatState;
  }, [chatState]);

  const initialiseAbly = async (userId: string) => {
    await initAblyForUser(userId);
    subscribeToUserChannel(userId, {
      onResponseStart: () => {
        console.log("user :  onResponseStart");
        // update chat list entry to "AI generating..."
      },
      onResponseDone: (payload: any) => {
        const updateChats = (answer: string) => {
          console.log(
            "room : onDone",
            JSON.stringify(chatStateRef?.current?.chats, null, 4)
          );
          const chats = chatStateRef.current.chats?.map((c) => {
            const chat = { ...c };
            if (chat._id === chatState.selectedChat?._id) {
              if (answer) {
                chat.lastAnswer = answer;
              }
            }
            return chat;
          });
          dispatch(setChats(chats));
        };
        updateChats(payload?.final?.msg);
      },
      onResponseFailed: (data: any) => {
        console.log("user :  onResponseFailed", JSON.stringify(data));
        // show notification & mark chat as failed
      },
    });
  };

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
    if (authReducer.user) {
      initialiseAbly(authReducer.user._id);
    }
  }, [authReducer.user]);

  useEffect(() => {
    if (chatState.selectedChat?._id?.trim()) {
      localStorage.setItem("chatId", chatState.selectedChat?._id);
    }
  }, [chatState.selectedChat]);
  useEffect(() => {
    // const selectedChatId = localStorage.getItem("chatId");
    // if (selectedChatId && selectedChatId !== "undefined" && chatState.chats) {
    //   const selectedChat =
    //     Array.isArray(chatState.chats) &&
    //     chatState.chats.find((chat) => chat._id === selectedChatId);
    //   if (
    //     selectedChat &&
    //     selectedChat?._id?.trim() &&
    //     chatState?.selectedChat?._id !== selectedChat?._id
    //   ) {
    //     dispatch(setSelectedChat(selectedChat));
    //   }
    // }
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
      <main className="flex w-full h-screen overflow-scroll bg-gradient-to-b from-[#ece6f1] via-[#EEEDE4] to-[#EDDEE3]">
        {(isMobile || isIpad) && !chatState.selectedChat && <Chats />}
        {!isMobile && !isIpad && <Chats />}
        <ChatPage />
        {isMobile && <BottomNav />}
      </main>
    </SidebarProvider>
  );
};

export default index;
