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
