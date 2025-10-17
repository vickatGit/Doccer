const types = ["pdf"];

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
export const formatDateWithLabels = (date: Date): string => {
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

  if (isToday) {
    return `Today ${dateString}`;
  } else if (isYesterday) {
    return `Yesterday ${dateString}`;
  } else {
    return dateString;
  }
};
