interface Pdf {
  id: number;
  name: string;
  data: File;
  createdAt: number;
  updatedAt: number;
}

function convertFilesToDataURLs(files: Array<File>) {
  return Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise<{
          type: "file";
          filename: string;
          mediaType: string;
          url: string;
        }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              type: "file",
              filename: file.name,
              mediaType: file.type,
              url: reader.result as string,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }),
    ),
  );
}

export async function convertPDFsToDataURLs(pdfs: Array<Pdf>) {
  const fileParts = await convertFilesToDataURLs(pdfs?.map((f) => f.data) ?? []);

  return fileParts;
}
