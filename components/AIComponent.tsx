import React, { useRef, useState } from "react";
import { UploadDropzone } from "react-uploader";
import { UploadWidgetConfig, Uploader } from "uploader";
import Step from "./Step";
import { Toaster, toast } from "react-hot-toast";
import { roomType, themeType } from "../utils/dropdownTypes";
import { GenerateResponseData } from "../pages/api/generate";
import { CompareSlider } from "./CompareSlider";
import Toggle from "./Toggle";
import downloadPhoto from "../utils/downloadPhoto";
import appendNewToName from "../utils/appendNewToName";
import Image from "next/image";
import useSWRMutation from "swr/mutation";
import { serverSWR } from "../services/swrConfig";
import { Button, Loading } from "@nextui-org/react";
import { GenerateIcon } from "./icons/GenerateIcon";

const uploader = Uploader({
  apiKey: !!process.env.NEXT_PUBLIC_UPLOAD_API_KEY
    ? process.env.NEXT_PUBLIC_UPLOAD_API_KEY
    : "free",
});

const options: UploadWidgetConfig = {
  maxFileCount: 1,
  mimeTypes: ["image/jpeg", "image/png", "image/jpg"],
  editor: {
    images: {
      crop: false,
      preview: true,
    },
  },
};

const AIComponent = () => {
  const [originalPhoto, setOriginalPhoto] = useState<string | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [restoredLoaded, setRestoredLoaded] = useState<boolean>(false);
  const [sideBySide, setSideBySide] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  const { trigger, isMutating } = useSWRMutation(
    "/api/generate",
    (url: string, { arg }: { arg: any }) => serverSWR.post(url, arg)
  );
  const { trigger: promptTrigger, isMutating: isCaptionMutating } =
    useSWRMutation("/api/caption", (url: string, { arg }: { arg: any }) =>
      serverSWR.post(url, arg)
    );

  const onGeneratePhoto = async () => {
    try {
      if (originalPhoto)
        generatePhoto({
          imageUrl: originalPhoto,
          prompt: description || "",
        });
    } catch (error) {
      console.log(error);
    }
  };
  async function generatePrompt() {
    try {
      if (originalPhoto) {
        const res = (await promptTrigger({ imageUrl: originalPhoto })) as {
          caption: string;
        };
        if (res) {
          toast.success("Generate prompt successfully");
          setDescription(res.caption);
        }
      }
    } catch (error) {
      toast.error("Generate prompt failed , please try again");
      console.log(error);
    }
  }

  async function generatePhoto({
    imageUrl,
    prompt,
  }: {
    imageUrl: string;
    prompt?: string;
  }) {
    try {
      setLoading(true);
      const res = (await trigger({
        imageUrl,
        prompt,
      })) as GenerateResponseData;
      if (res) {
        const rooms =
          (JSON.parse(localStorage.getItem("rooms") || "[]") as string[]) || [];
        rooms.push(res.id);
        localStorage.setItem("rooms", JSON.stringify(rooms));
        setRestoredImage(res.generated);
        toast.success("Generate successfully");
      }
    } catch (error) {
      console.log(error);
      toast.error("Generate failed , please try again");
    }
  }
  return (
    <div className="flex flex-col gap-5">
      <Toaster position="top-center" reverseOrder={false} />
      <div
        className={`${
          restoredLoaded ? "visible flex justify-center" : "invisible"
        }`}
      >
        <Toggle
          sideBySide={sideBySide}
          setSideBySide={(newVal) => setSideBySide(newVal)}
        />
      </div>
      {restoredImage && originalPhoto && (
        <div className="flex justify-center gap-6">
          {!sideBySide ? (
            <>
              <div>
                <h2 className="mb-1 font-medium text-lg">Original Room</h2>
                <Image
                  alt="original photo"
                  src={originalPhoto}
                  className="rounded-2xl relative w-full h-96"
                  width={475}
                  height={475}
                />
              </div>
              <div className="sm:mt-0 mt-8">
                <h2 className="mb-1 font-medium text-lg">Generated Room</h2>
                <a href={restoredImage} target="_blank" rel="noreferrer">
                  <Image
                    alt="restored photo"
                    src={restoredImage}
                    className="rounded-2xl relative sm:mt-0 mt-2 cursor-zoom-in w-full h-96"
                    width={475}
                    height={475}
                    onLoadingComplete={() => setRestoredLoaded(true)}
                  />
                </a>
              </div>{" "}
            </>
          ) : (
            <CompareSlider
              original={originalPhoto!}
              restored={restoredImage!}
            />
          )}
        </div>
      )}
      {!restoredImage ? (
        <>
          <div className="flex flex-col items-center">
            <Step text="1" description="Upload a picture of your room" />
            <UploadDropzone
              uploader={uploader}
              options={options}
              onUpdate={(file) => {
                if (file.length !== 0) {
                  setPhotoName(file[0].originalFile.originalFileName);
                  setOriginalPhoto(file[0].fileUrl.replace("raw", "thumbnail"));
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
              value={description || ""}
              onChange={(e) => {
                setDescription(e.target.value);
              }}
            ></textarea>
            <Button
              onClick={generatePrompt}
              disabled={!originalPhoto?.length ? true : false}
              iconRight={<GenerateIcon />}
            >
              {isCaptionMutating ? (
                <Loading type="points" color="currentColor" size="sm" />
              ) : (
                <> Generate prompt</>
              )}
            </Button>
          </div>
          <div className="flex flex-col items-center gap-6">
            <Button
              onClick={onGeneratePhoto}
              disabled={!originalPhoto?.length ? true : false}
              iconRight={<GenerateIcon />}
            >
              {isMutating ? (
                <Loading type="points" color="currentColor" size="sm" />
              ) : (
                <> Generate room</>
              )}
            </Button>
          </div>
        </>
      ) : null}
      <div className="flex space-x-2 justify-center">
        {restoredImage ? (
          <button
            onClick={() => {
              setOriginalPhoto(null);
              setRestoredImage(null);
              setRestoredLoaded(false);
              setError(null);
              setSideBySide(false);
            }}
            className="bg-blue-500 rounded-full text-white font-medium px-4 py-2 mt-8 hover:bg-blue-500/80 transition"
          >
            Generate New Room
          </button>
        ) : null}
        {restoredLoaded && (
          <button
            onClick={() => {
              downloadPhoto(restoredImage!, appendNewToName(photoName!));
            }}
            className="bg-white rounded-full text-black border font-medium px-4 py-2 mt-8 hover:bg-gray-100 transition"
          >
            Download Generated Room
          </button>
        )}
      </div>
    </div>
  );
};

export default AIComponent;
