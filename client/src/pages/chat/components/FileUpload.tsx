import React, { useEffect, useRef } from "react";
import { UploadCloud } from "lucide-react";
import FileCard from "./FileCard";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface FileUploadGlassProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  multiple?: boolean;
  compact?: boolean;
  label?: string;
  uploadFile: any;
  setOpen: any;
  fileInfos: any[] | null | undefined;
}

const FileUpload: React.FC<FileUploadGlassProps> = ({
  onFileChange,
  multiple = true,
  compact = true,
  fileInfos,
  uploadFile,
  setOpen,
  label = "Click or drag files here",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => inputRef.current?.click();

  useEffect(() => {
    console.log("file infos changed : ", fileInfos);
  }, [fileInfos]);

  return (
    <div
      className={`z-50 w-full h-full flex flex-col justify-center items-center  rounded-[2rem] border border-white/20 
                  bg-white/10 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.1)]
                  transition-all duration-300 ease-in-out hover:bg-white/20
                  ${compact ? "p-3" : "p-6"}`}
    >
      <div
        className="w-4 h-4 text-red-500 absolute top-5 right-5 cursor-pointer"
        onClick={() => {
          setOpen(false);
        }}
      >
        <XMarkIcon color="text-red-500" />
      </div>

      <div
        className={`grid overflow-scroll pb-16 mt-5 ${
          fileInfos?.length == 1 ? "grid-cols-1" : "grid-cols-2"
        } gap-3`}
      >
        {fileInfos?.map((file) => (
          <FileCard
            showFade={true}
            name={file.name}
            logo={file.logo}
            firstFiveLines={file.firstFiveLines}
          />
        ))}
      </div>

      {fileInfos && fileInfos.length > 0 ? (
        <div
          className="absolute bottom-3 z-50 cursor-pointer text-[0.7rem] px-3 py-2 rounded-[2rem] border border-black/20 
                  bg-white/70 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
          onClick={uploadFile}
        >
          Upload Files
        </div>
      ) : (
        <div className="cursor-pointer" onClick={triggerFileInput}>
          <input
            ref={inputRef}
            type="file"
            multiple={multiple}
            onChange={onFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center text-black select-none">
            <UploadCloud size={40} className="mb-2 opacity-80" />
            <p className="text-sm font-medium text-black">{label}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
