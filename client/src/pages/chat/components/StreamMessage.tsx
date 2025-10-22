import React from "react";
import ReactMarkdown from "react-markdown";

type Props = {
  msg: string;
};
const StreamMessage: React.FC<Props> = ({ msg }) => {
  const isHighlighted = false;
  return (
    <div>
      <div
        className={`flex justify-start mt-15 p-${isHighlighted ? 2 : 0} ${
          isHighlighted ? "bg-[#eae9fc]" : "bg-transparent"
        }`}
      >
        <div
          className={`rounded-[2rem] bg-white shadow-xl font-medium relative py-5 px-5 max-w-[90%] min-w-[5rem] mb-[-0.4rem]`}
        >
          <div className="flex flex-col gap-0.5 items-end italic">
            {/* {message.roomType !== "One-To-One" && (
              <div className="text-[0.5rem]  w-full text-[#B8B5F7] mb-[-0.25rem] italic">
                {message.senderName && `${message.senderName}`}
              </div>
            )} */}
            <pre
              className=" w-full not-italic"
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
              {/* {msg?.msg} */}
              <ReactMarkdown>{msg}</ReactMarkdown>
            </pre>
          </div>
          {/* <div className="flex">
            <p className="text-[#3E414C] text-[0.5rem]">
              {formatTimeToAMPM(message.createdAt)}
            </p>
          </div> */}
        </div>
      </div>
      {/* <div className='text-[0.7rem] text-gray-500 ml-4 '>
        {msgSenderName && `sent by ${msgSenderName}`}
      </div> */}
    </div>
  );
};

export default StreamMessage;
