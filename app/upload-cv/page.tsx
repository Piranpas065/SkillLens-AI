import FileUploader from "../../components/FileUploader";

export default function UploadCV() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="py-2 px-2 w-full max-w-4xl md:max-w-6xl sm:max-w-2xl">
          {/* Render the FileUploader component which handles all PDF upload logic */}
          <FileUploader />
        </div>
      </div>
    </div>
  );
}
