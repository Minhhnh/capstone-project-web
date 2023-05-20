import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import prisma from "../../lib/prismadb";
import fetch from "isomorphic-unfetch";
import { v4 as uuidv4 } from "uuid";
import probe from "probe-image-size";

export type GenerateResponseData = {
  original: string | null;
  generated: string | null;
  id: string;
};

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    imageUrl: string;
  };
}

export async function toBase64ImageUrl(imgUrl: string): Promise<string> {
  const fetchImageUrl = await fetch(imgUrl);
  console.log(fetchImageUrl);
  const responseArrBuffer = await fetchImageUrl.arrayBuffer();
  const toBase64 = `data:${
    fetchImageUrl.headers.get("Content-Type") || "image/png"
  };base64,${Buffer.from(responseArrBuffer).toString("base64")}`;
  return toBase64;
}

export default async function handler(
  req: ExtendedNextApiRequest,
  res: NextApiResponse<GenerateResponseData | string>
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(500).json("Login to upload.");
  }

  try {
    const { imageUrl } = req.body;

    let base64Image = await toBase64ImageUrl(imageUrl);

    const size = await probe(imageUrl);

    // POST request to Replicate to start the image restoration generation process
    let startResponse = await fetch("http://127.0.0.1:7860/api/clip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
      }),
    });
    const data = await startResponse.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json("Failed to restore image");
  }
}
