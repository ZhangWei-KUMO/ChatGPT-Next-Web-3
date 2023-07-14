import { Analytics } from "@vercel/analytics/react";
import Image from "next/image";

import { Home } from "./components/home";

import { getServerSideConfig } from "./config/server";

const serverConfig = getServerSideConfig();

export default async function App() {
  return (
    <>
      <div className="logo">
        <Image src="/relai-logo.png" alt="avatar" width={350} height={200} />
      </div>
      <Home />
      {serverConfig?.isVercel && <Analytics />}
    </>
  );
}
