import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfThumb = ({ fileUrl }: { fileUrl: string }) => {
  return (
    <div className="w-full border shadow">
      <Document file={fileUrl} loading="Loading..." error="Failed to load PDF">
        <Page pageNumber={1} width={300} />
      </Document>
    </div>
  );
};

export default PdfThumb;
