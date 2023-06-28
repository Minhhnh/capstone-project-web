import { Loading } from "@nextui-org/react";
import { useEffect, useState } from "react";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

function getMeta(url: string, callback: Function, errorCallBack: Function) {
  const img = new Image();
  img.src = url;
  img.onload = function () {
    callback(img.width, img.height);
  };
  img.onerror = function () {
    errorCallBack();
  };
}

export const CompareSlider = ({
  original,
  restored,
}: {
  original: string;
  restored: string;
}) => {
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMeta(
      original,
      (width: number, height: number) => {
        setWidth(width);
        setHeight(height);
        setLoading(false);
      },
      () => {
        setWidth(800);
        setHeight(600);
        setLoading(false);
      }
    );
  }, []);

  return (
    <div className="my-6">
      {loading ? (
        <Loading size="lg" />
      ) : (
        <ReactCompareSlider
          style={{
            width: `${width}px`,
            height: `${height}px`,
            maxWidth: "800px",
            maxHeight: "800px",
            aspectRatio: `${width || 400}/${height || 600}`,
          }}
          itemOne={
            <ReactCompareSliderImage
              style={{ objectFit: "cover" }}
              src={original}
              alt="original photo"
            />
          }
          itemTwo={
            <ReactCompareSliderImage
              style={{ objectFit: "cover" }}
              src={restored}
              alt="generated photo"
            />
          }
          portrait
          className={` mt-5 h-96 apsec-[${width || 4}/${height || 3}]`}
        />
      )}
    </div>
  );
};
