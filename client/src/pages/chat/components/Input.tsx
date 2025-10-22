import { docApi, getAnswer } from "@/api";
import { checkType, getFileSizeMB, maxSize, rerieveFileInfos } from "@/helpers";
import { AppDispatch, RootState } from "@/store";
import { addMessage, IMessage, setChats } from "@/store/reducers/chat";
import {
  ArrowUpTrayIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import FileCard from "./FileCard";

const Input = () => {
  const [attachements, setAttachments] = useState<File[] | null>();
  const [fileInfos, setFileInfos] = useState<any[] | null>();
  const chatState = useSelector((state: RootState) => state.chatReducer);
  const userState = useSelector((state: RootState) => state.authReducer);
  const dispatch = useDispatch<AppDispatch>();
  const [question, setQuestion] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const fetchFileInfos = async () => {
    if (!attachements || attachements.length === 0) return;

    const infos = await Promise.all(
      Array.from(attachements).map((file) => rerieveFileInfos(file))
    );

    console.log("All file infos:", infos);
    // You can set state here if you want to store all file info
    setFileInfos(infos);
  };
  useEffect(() => {
    fetchFileInfos();
  }, [attachements]);

  const updateChats = (
    question: string,
    answer: string,
    type: "question" | "answer"
  ) => {
    const chats = chatState.chats?.map((c) => {
      const chat = { ...c };
      if (chat._id === chatState.selectedChat?._id) {
        if (question) {
          chat.lastMessage = question;
        }
        if (answer) {
          chat.lastAnswer = answer;
        }
        console.log("got the chat : ", chat);
      }
      return chat;
    });

    const message: IMessage = {
      _id: uuidv4(),
      chat: chatState.selectedChat?._id!,
      createdAt: Date.now().toString(),
      updateAt: Date.now().toString(),
      type: type,
      msg: type === "question" ? question : answer,
      userId: userState.user?._id!,
    };
    console.log("message : ", message);
    dispatch(addMessage(message));
    dispatch(setChats(chats));
    setQuestion("");
  };
  const submitQuestion = async () => {
    console.log("updating");
    updateChats(question, "...", "question");
    if (attachements) {
      await uploadFile();
    }
    if (chatState.selectedChat) {
      await getAnswer(chatState.selectedChat?._id?.toString(), question);
    }
  };

  const uploadFile = async () => {
    if (!attachements || attachements.length === 0) {
      console.log("No files to upload");
      return;
    }

    const formData = new FormData();

    // Append each file individually
    attachements?.forEach((file) => {
      formData.append("files", file); // use "files" if backend expects multiple
      console.log(`Appending file: ${file.name}`);
    });

    try {
      await docApi.post(
        `/api/chat/upload/${(chatState.selectedChat as any)._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Files uploaded successfully");
      setFileInfos(null);
      setAttachments(null);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  // const uploadFile = async () => {
  //   const formData = new FormData();
  //   formData.append("file", attachements!);
  //   await docApi.post(
  //     `/api/chat/upload/${(chatState.selectedChat as any)._id}`,
  //     formData,
  //     {
  //       headers: {
  //         "Content-type": "multipart/form-data",
  //       },
  //     }
  //   );
  //   setFileInfos(null);
  //   setAttachments(null)
  // };
  // const handleFileChange = async (e: any) => {
  //   const files = e.target.files;
  //   e.target.value = "";
  //   if (!checkType(file)) {
  //     return;
  //   }

  //   if (maxSize && getFileSizeMB(file) > maxSize) {
  //     return;
  //   }
  //   setAttachments(files);
  // };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileChange triggered");
    const files = e.target.files;

    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }

    console.log(`Total files selected: ${files.length}`);
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(
        `\nProcessing file ${i + 1} of ${files.length}: ${file.name}`
      );
      console.log(`- File size: ${file.size} bytes`);
      console.log(`- File type: ${file.type}`);

      // Check type
      if (!checkType(file)) {
        console.log(`❌ ${file.name} failed type validation`);
        continue;
      } else {
        console.log(`✅ ${file.name} passed type validation`);
      }

      // Check size
      if (maxSize && getFileSizeMB(file.size) > maxSize) {
        console.log(
          `❌ ${file.name} failed size validation (${getFileSizeMB(
            file.size
          ).toFixed(2)} MB)`
        );
        continue;
      } else if (maxSize) {
        console.log(
          `✅ ${file.name} passed size validation (${getFileSizeMB(
            file.size
          ).toFixed(2)} MB)`
        );
      }

      validFiles.push(file);
      console.log(`➡️ ${file.name} added to validFiles`);
    }

    if (validFiles.length === 0) {
      console.log("No valid files to upload");
    } else {
      console.log(`Total valid files: ${validFiles.length}`);
      validFiles.forEach((f, idx) => console.log(`- ${idx + 1}: ${f.name}`));
      setAttachments(validFiles);
    }

    // Clear input AFTER processing
    e.target.value = "";
    console.log("File input cleared");
  };

  const doesFileExist =
    attachements || (chatState.selectedChat?.files?.length || 0) > 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-fit pb-11 shrink-0 px-28 bg-transparent">
      <div className="flex gap-4">
        {fileInfos?.map((file) => {
          return (
            <FileCard
              name={file.name}
              logo={file.logo}
              firstFiveLines={file.firstFiveLines}
              showFade={true}
            />
            // <div
            //   className="relative w-36 h-40  border-white/20 rounded-[1rem]
            //  bg-white/10 backdrop-blur-lg overflow-hidden border-2
            //  shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
            // >
            //   {/* Gradient Glow Layer */}
            //   <div
            //     className="absolute inset-0
            //    bg-[radial-gradient(circle_at_center,_rgba(195,220,168,0.7)_0%,_rgba(195,220,168,0.3)_55%,_rgba(195,220,168,0.08)_100%)]
            //    mix-blend-soft-light opacity-85 pointer-events-none"
            //   ></div>

            //   <div className="w-full h-full p-2">
            //     <div className="w-10 h-10 bg-white/50 p-1.5 rounded-full backdrop-blur-lg ">
            //       <img src={file.logo} className="w-full h-full" />
            //     </div>

            //     <p className="w-full font-semibold mt-1.5 text-[0.65rem]  break-all line-clamp-1 text-ellipsis">
            //       {file?.name}
            //     </p>

            //     <p className="w-full text-[0.65rem] mt-1 line-clamp-5 break-words">
            //       {file.firstFiveLines}
            //     </p>
            //     <div
            //       className="absolute bottom-0 px-4 z-20 top-25 left-0 right-0 pt-2
            //  backdrop-blur-lg
            //  bg-gradient-to-t from-white/30 via-white/30 to-transparent
            //  shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
            //       style={{
            //         WebkitMaskImage:
            //           "linear-gradient(to top, black 0%, black 45%, transparent 100%)",
            //         maskImage:
            //           "linear-gradient(to top, black 0%, black 45%, transparent 100%)",
            //       }}
            //     ></div>
            //   </div>

            //   {/* Your actual content here */}
            // </div>
          );
        })}
      </div>

      <div
        className="relative flex flex-col flex-1 py-2 border border-white/20 rounded-[2.5rem] mt-2 
               bg-white/10 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
      >
        <div className="flex w-full h-full items-center px-3 gap-2 ">
          {/* {!(chatState.selectedChat as any)?.file && ( */}

          <div
            className="relative shrink-0 w-8 h-8 rounded-md p-2 cursor-pointer"
            onClick={handleUploadClick}
          >
            <ArrowUpTrayIcon className="w-full h-full cursor-pointer" />
            <input
              type="file"
              ref={fileInputRef}
              autoComplete="off"
              onChange={handleFileChange}
              multiple
              className="absolute inset-0 w-2 h-2 opacity-0 cursor-pointer"
              style={{ zIndex: 10 }}
            />
          </div>

          <textarea
            rows={1}
            className="border-transparent focus:border-transparent outline-none text-sm flex-1 bg-transparent  resize-none pl-"
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                if (!e.shiftKey) {
                  e.preventDefault();
                  {
                    doesFileExist && submitQuestion();
                  }
                }
              }
            }}
            value={question}
            placeholder={`${
              doesFileExist
                ? "Ask me anything..."
                : "Please Upload File to Start the Chat"
            }`}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <div
            className={`bg-white w-10 h-10 flex justify-center items-center rounded-full
             ${
               doesFileExist ? "cursor-pointer" : "cursor-not-allowed"
             } flex-shrink-0 w-5 h-5 ${
              doesFileExist ? "text-primary" : "text-primary/30"
            }`}
          >
            <div
              className={`bg-white ${
                doesFileExist ? "cursor-pointer" : "cursor-not-allowed"
              } flex-shrink-0 w-5 h-5 ${
                doesFileExist ? "text-primary" : "text-primary/30"
              } `}
              onClick={() => {
                {
                  true && submitQuestion();
                }
              }}
            >
              <PaperAirplaneIcon />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Input;
