import React, { useState } from "react";
import { UploadDropzone } from "react-uploader";
import { Uploader } from "uploader";
import Step from "./Step";
import useSWR from "swr";
import { roomType, themeType } from "../utils/dropdownTypes";
import { GenerateResponseData } from "../pages/api/generate";

const uploader = Uploader({
  apiKey: !!process.env.NEXT_PUBLIC_UPLOAD_API_KEY
    ? process.env.NEXT_PUBLIC_UPLOAD_API_KEY
    : "free",
});

const options = {
  maxFileCount: 1,
  mimeTypes: ["image/jpeg", "image/png", "image/jpg"],
  editor: { images: { crop: false } },
};

const AIComponent = () => {
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [restoredLoaded, setRestoredLoaded] = useState<boolean>(false);
  const [sideBySide, setSideBySide] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [theme, setTheme] = useState<themeType>("Modern");
  const [room, setRoom] = useState<roomType>("Living Room");

  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data, mutate } = useSWR("/api/remaining", fetcher);

  async function generatePhoto(fileUrl: string) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    setLoading(true);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl: fileUrl, theme, room }),
    });

    let response = (await res.json()) as GenerateResponseData;
    if (res.status !== 200) {
      setError(response as any);
    } else {
      mutate();
      const rooms =
        (JSON.parse(localStorage.getItem("rooms") || "[]") as string[]) || [];
      rooms.push(response.id);
      localStorage.setItem("rooms", JSON.stringify(rooms));
      setRestoredImage(response.generated);
    }
    setTimeout(() => {
      setLoading(false);
    }, 1300);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center">
        <Step text="1" description="Upload a picture of your room" />
        <UploadDropzone
          uploader={uploader}
          options={options}
          onUpdate={(file) => {
            if (file.length !== 0) {
              setPhotoName(file[0].originalFile.originalFileName);
              setOriginalPhoto(file[0].fileUrl.replace("raw", "thumbnail"));
              generatePhoto(file[0].fileUrl.replace("raw", "thumbnail"));
            }
          }}
          width="670px"
          height="250px"
        />
      </div>
      <div className="flex flex-col items-center gap-6">
        <Step text="2" description="Generate prompt" />
        <textarea
          id="message"
          rows={3}
          className="w-[640px] rounded-md text-slate-600"
        ></textarea>
        <button className="bg-[#2563eb] px-5 py-3 rounded-lg">
          Generate prompt
        </button>
      </div>
      <div className="flex flex-col items-center gap-6">
        <button className="bg-[#2563eb] px-5 py-3 rounded-lg">
          Generate new room
        </button>
      </div>
    </div>
  );
};

export default AIComponent;
