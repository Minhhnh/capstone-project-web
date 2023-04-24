import React from "react";

const Step = ({ text, description }: { text: string; description: string }) => {
  return (
    <div className="flex items-center gap-5">
      <div className="bg-slate-50 text-slate-600 rounded-full p-5 w-6 h-6 flex justify-center items-center font-bold">
        {text}
      </div>
      <p className="text-white">{description}</p>
    </div>
  );
};

export default Step;
