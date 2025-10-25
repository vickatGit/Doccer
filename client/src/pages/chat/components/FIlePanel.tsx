import React, { useRef, useState, useEffect } from "react";
import * as Popover from "@radix-ui/react-popover";
import FileCard from "./FileCard";
import csvIcon from "@/assets/csv.png";
import DocumentsIcon from "@/assets/documents.png";
import { IFile } from "@/store/reducers/chat";
import {
  extractFirstFiveLinesFromS3,
  getFileExtenstion,
  getFileLogo,
} from "@/helpers";

type Props = {
  files: IFile[];
};
const FilePanel: React.FC<Props> = (props) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<any[]>();

  useEffect(() => {
    const processFiles = async () => {
      if (!props.files || props.files.length === 0) return;
      const files = [];
      for (const file of props.files) {
        try {
          const firstFiveLines = (
            await extractFirstFiveLinesFromS3(file.url)
          ).join(" ");
          const info = {
            name: file.name,
            logo: getFileLogo(getFileExtenstion(file.name)),
            firstFiveLines,
          };
          files.push(info);
          console.log("File Info:", info);
        } catch (err) {
          console.error("Error processing file:", file.name, err);
        }
      }
      setFiles(files);
    };

    processFiles();
  }, [props.files]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <div
          className={`w-10 h-10 rounded-full p-2.5 border border-white/20
                      backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.05)]
                     cursor-pointer transition ${
                       open ? "bg-primary/10" : "bg-white/30"
                     } `}
        >
          <img src={DocumentsIcon} alt="Documents" />
        </div>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="left"
          align="center"
          sideOffset={10}
          className="z-[9999] overflow-y-auto p-4 min-w-fit max-w-[22rem] min-h-fit max-h-[26rem] outline-none
                     border border-white rounded-[2rem] selection:border-white
                     bg-white/10 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.1)]
                     data-[state=open]:animate-in data-[state=closed]:animate-out
                     data-[side=bottom]:slide-in-from-top-2
                     data-[side=left]:slide-in-from-right-2"
        >
          <div
            className={`grid ${
              files?.length == 1 ? "grid-cols-1" : "grid-cols-2"
            } gap-3`}
          >
            {files?.map((file, i) => (
              <FileCard
                showFade={true}
                name={file.name}
                logo={file.logo}
                firstFiveLines={file.firstFiveLines}
              />
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default FilePanel;
