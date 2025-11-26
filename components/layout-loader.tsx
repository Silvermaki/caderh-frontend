"use client";
import React from "react";
import Image from "next/image";
import caderhLogoSmall from "@/public/images/logo/short-icon.png";
import { Loader2 } from "lucide-react";
const LayoutLoader = () => {
  return (
    <div className=" h-screen flex items-center justify-center flex-col space-y-2">
      <Image src={caderhLogoSmall} alt="CADERH" className="h-10 w-auto mx-auto" priority={true} />
      <span className=" inline-flex gap-1">
        <Loader2 color="#0C7AA3" className="mr-2 h-4 w-4 animate-spin" />
        Cargando...
      </span>
    </div>
  );
};

export default LayoutLoader;
