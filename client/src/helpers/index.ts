import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import pdf from "@/assets/pdf.png";
import docs from "@/assets/docs.png";
import txt from "@/assets/txt.png";
import csv from "@/assets/csv.png";
import axios from "axios";
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const types = ["pdf", "docx", "doc", "txt", "csv"];
const fileTypeLogos: Record<string, string> = {
  pdf,
  docx: docs,
  doc: docs,
  txt,
  csv,
};

export const maxSize = 4;

export const checkType = (file: File): boolean => {
  const extension = file.name.split(".").pop();
  if (extension) {
    return types.includes(extension.toLowerCase());
  }

  return false;
};

export const getFileSizeMB = (size: number): number => {
  return size / 1024 / 1024;
};
export const formatDateWithLabels = (
  date: Date,
  addDay: boolean = true
): { day: string; dateString: string } => {
  const now = new Date();

  const inputDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isToday = inputDate.getTime() === today.getTime();
  const isYesterday = inputDate.getTime() === yesterday.getTime();

  const dateString = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
  });
  let day: string = "";
  if (isToday) day = "Today";
  else if (isYesterday) day = "Yesterday";

  return { day, dateString };
};

export async function extractFirstFiveLines(file: File): Promise<string[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (!ext) throw new Error("Unknown file type");

  if (ext === "txt") {
    const text = await file.text();
    return text.split(/\r?\n/).slice(0, 5);
  }

  if (ext === "pdf") {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let textContent = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 2); i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      textContent += text.items.map((item: any) => item.str).join(" ") + "\n";
      if (textContent.split(/\r?\n/).length > 5) break;
    }
    return textContent.split(/\r?\n/).slice(0, 5);
  }

  if (ext === "docx") {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.split(/\r?\n/).slice(0, 5);
  }

  if (ext === "doc") {
    // .doc (binary) – browser doesn’t handle well natively
    // Ideally handled on backend, but you can approximate:
    const text = await file.text();
    return text.split(/\r?\n/).slice(0, 5);
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

export async function extractFirstFiveLinesFromS3(
  s3Url: string
): Promise<string[]> {
  if (!s3Url) throw new Error("S3 URL is required");

  const ext = s3Url.split(".").pop()?.toLowerCase();
  if (!ext) throw new Error("Unable to detect file type from URL");

  let textContent = "";

  if (ext === "txt" || ext === "csv") {
    const { data } = await axios.get(s3Url, { responseType: "text" });
    textContent = data;
  } else if (ext === "pdf") {
    const { data } = await axios.get(s3Url, { responseType: "arraybuffer" });
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    for (let i = 1; i <= Math.min(pdf.numPages, 2); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      textContent +=
        content.items.map((item: any) => item.str).join(" ") + "\n";
      if (textContent.split(/\r?\n/).length > 5) break;
    }
  } else if (ext === "docx") {
    const { data } = await axios.get(s3Url, { responseType: "arraybuffer" });
    const result = await mammoth.extractRawText({ buffer: data });
    textContent = result.value;
  } else if (ext === "doc") {
    // Old binary DOC – no direct parsing in browser; best-effort fallback
    const { data } = await axios.get(s3Url, { responseType: "text" });
    textContent = data;
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const lines = textContent.split(/\r?\n/).filter((line) => line.trim() !== "");
  return lines.slice(0, 5);
}

export const getFileExtenstion = (fileName: string) =>
  fileName.split(".").pop()?.toLowerCase() || "unknown";

export const getFileLogo = (ext: string) => fileTypeLogos[ext] || txt;

export const rerieveFileInfos = async (file: File) => {
  const ext = getFileExtenstion(file.name);
  const firstFiveLines = await extractFirstFiveLines(file);

  // Pick logo based on type, fallback to txt if unknown
  const logo = getFileLogo(ext);

  return {
    name: file.name,
    type: ext,
    firstFiveLines,
    logo,
    file,
  };
};
