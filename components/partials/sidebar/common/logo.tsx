import { useSidebar } from "@/store";
import React from "react";
import Image from "next/image";
import caderhLogoSmall from "@/public/images/logo/short-icon.png";
import caderhLogo from "@/public/images/logo/caderh-logo.jpg";
import { useTheme } from "next-themes";

const SidebarLogo = ({ hovered }: { hovered?: boolean }) => {
  const { sidebarType, setCollapsed, collapsed } = useSidebar();
  const { theme } = useTheme();
  return (
    <div className="">
      <div className=" flex items-center">
        <div className="flex flex-1 items-center gap-x-3  ">
          {(!collapsed || hovered) && (
            <Image src={caderhLogo} alt="CADERH" className="h-16 w-auto mx-auto" priority={true} />
          )}
        </div>
        {!(!collapsed || hovered) && (
          <div className="w-full flex flex-row justify-center pt-3 pb-2">
            <Image src={caderhLogoSmall} alt="CADERH" className="h-10 w-auto mx-auto" priority={true} />
          </div>
        )}
        {sidebarType === "classic" && (!collapsed || hovered) && (
          <div className="flex-none lg:block hidden">
            <div
              onClick={() => setCollapsed(!collapsed)}
              className={`h-4 w-4 border-[1.5px] border-default-900 dark:border-default-200 rounded-full transition-all duration-150
          ${collapsed
                  ? ""
                  : "ring-2 ring-inset ring-offset-4 ring-default-900  bg-default-900  dark:ring-offset-default-300"
                }
          `}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarLogo;
