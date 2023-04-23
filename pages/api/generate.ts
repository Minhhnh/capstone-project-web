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
    theme: string;
    room: string;
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
  // Check if user is logged in
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(500).json("Login to upload.");
  }

  // Get user from DB
  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email!,
    },
    select: {
      credits: true,
    },
  });

  // Check if user has any credits left
  // if (user?.credits === 0) {
  //   return res.status(400).json(`You have no generations left`);
  // }

  // If they have credits, decrease their credits by one and continue
  await prisma.user.update({
    where: {
      email: session.user.email!,
    },
    data: {
      credits: {
        increment: 1,
      },
    },
  });

  try {
    const { imageUrl, theme, room } = req.body;
    const prompt =
      room === "Gaming Room"
        ? "a video gaming room"
        : `a ${theme.toLowerCase()} ${room.toLowerCase()}`;

    let base64Image = await toBase64ImageUrl(imageUrl);

    const size = await probe(imageUrl);

    // POST request to Replicate to start the image restoration generation process
    let startResponse = await fetch("http://127.0.0.1:7860/api/img2img", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        init_images: [base64Image],
        steps: 70,
        prompt: prompt,
        // + " best quality, photo from Pinterest, interior, cinematic photo, ultra-detailed, ultra-realistic, award-winning, interior design, natural lighting",
        negative_prompt:
          "longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality",
        width: size.width,
        height: size.height,
        denoising_strength: 0.6,
      }),
    });

    console.log();
    let jsonStartResponse = await startResponse.json();

    let endpointUrl = "http://127.0.0.1:7860/api/img2img";
    const originalImage = imageUrl;
    const roomId = uuidv4();

    // GET request to get the status of the image restoration process & return the result when it's ready
    let generatedImage: string | null = null;
    // while (!generatedImage) {
    //   // Loop in 1s intervals until the alt text is ready
    //   let finalResponse = await fetch(endpointUrl, {
    //     method: "GET",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //   });
    //   let jsonFinalResponse = await finalResponse.json();

    //   if (jsonFinalResponse.status === "succeeded") {
    //     generatedImage = jsonFinalResponse.output[1] as string;
    //   } else if (jsonFinalResponse.status === "failed") {
    //     break;
    //   } else {
    //     await new Promise((resolve) => setTimeout(resolve, 1000));
    //   }
    // }
    let base64GeneratedImage: string = jsonStartResponse.images[0];

    generatedImage = "data:image/jpg;base64," + base64GeneratedImage;
    if (generatedImage) {
      await prisma.room.create({
        data: {
          replicateId: roomId,
          user: {
            connect: {
              email: session.user.email!,
            },
          },
          inputImage: originalImage,
          outputImage: generatedImage,
          prompt: prompt,
        },
      });
    } else {
      throw new Error("Failed to restore image");
    }

    res.status(200).json(
      generatedImage
        ? {
            original: originalImage,
            generated: generatedImage,
            id: roomId,
          }
        : "Failed to restore image"
    );
  } catch (error) {
    // Increment their credit if something went wrong
    await prisma.user.update({
      where: {
        email: session.user.email!,
      },
      data: {
        credits: {
          increment: 1,
        },
      },
    });
    console.error(error);
    res.status(500).json("Failed to restore image");
  }
}
