import { NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import { UploadDropzone } from "react-uploader";
import { Uploader } from "uploader";
import { CompareSlider } from "../components/CompareSlider";
import Footer from "../components/Footer";
import Header from "../components/Header";
import ResizablePanel from "../components/ResizablePanel";
import { useSession, signIn } from "next-auth/react";
import useSWR from "swr";
import { useRouter } from "next/router";
import Step from "../components/Step";
import AIComponent from "../components/AIComponent";

// Configuration for the uploader

const Home: NextPage = () => {
  const { data: session, status } = useSession();
  return (
    <div className="flex max-w-6xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
      <Head>
        <title>RoomGPT</title>
      </Head>
      <Header
        photo={session?.user?.image || undefined}
        email={session?.user?.email || undefined}
      />
      <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-4 sm:mb-0 mb-8">
        <h1 className="mx-auto max-w-4xl font-display text-4xl font-bold tracking-normal text-slate-100 sm:text-6xl mb-5">
          Generate your <span className="text-blue-600">dream</span> room
        </h1>

        <ResizablePanel>
          {status === "authenticated" ? (
            <AIComponent />
          ) : (
            <>
              <div className="h-[250px] flex flex-col items-center space-y-6 max-w-[670px] -mt-8">
                <div className="max-w-xl text-gray-300">
                  Sign in below with Google to create a free account and
                  redesign your room today. You will get 3 generations for free.
                </div>
                <button
                  onClick={() => signIn("google")}
                  className="bg-gray-200 text-black font-semibold py-3 px-6 rounded-2xl flex items-center space-x-2"
                >
                  <div>
                    <img
                      src="/google.png"
                      width={20}
                      height={20}
                      alt="google's logo"
                    />
                  </div>
                  <span>Sign in with Google</span>
                </button>
              </div>
            </>
          )}
        </ResizablePanel>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
