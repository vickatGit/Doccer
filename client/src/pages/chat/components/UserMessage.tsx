import { IMessage } from "@/store/reducers/chat";
import React from "react";

type Props = {
  msg: IMessage;
};

const UserMessage: React.FC<Props> = ({ msg }) => {
  const isHighlighted = false;

  return (
    <div
      className={`flex justify-end mt-10  p-${isHighlighted ? 2 : 0} ${
        isHighlighted ? "bg-[#eae9fc]" : "bg-transparent"
      }`}
      id={msg?._id}
    >
      <div
        className={`rounded-tl-[0.9rem] rounded-tr-[0.9rem] rounded-bl-[0.9rem] bg-[#D3C9DC] relative py-2 px-6 font-medium max-w-[700px] min-w-[5rem]`}
      >
        <div className="flex flex-col items-start gap-0.5">
          <pre
            className="w-full"
            style={{
              fontFamily: "inherit", // Inherit the font from the parent or global styles
              fontSize: "0.83rem", // Inherit the font size
              lineHeight: "inherit", // Inherit the line height
              whiteSpace: "pre-wrap", // Ensure long lines wrap to the next line
              wordWrap: "break-word", // Ensure words break properly if they're too long
              margin: 0, // Reset margin to avoid unexpected spacing
              padding: 0, // Reset padding if needed
            }}
          >
            {msg?.msg}
            {/* {message.msg} */}
          </pre>
          {/* <div className="flex justify-between w-full">
            <p className="text-white text-[0.5rem]">
              {formatTimeToAMPM(message.createdAt)}
            </p>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default UserMessage;
