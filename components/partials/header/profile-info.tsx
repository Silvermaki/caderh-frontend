"use client";
import React from "react";
import toast from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import caderhLogoSmall from "@/public/images/logo/short-icon.png";
import { useSession } from "next-auth/react";

const ProfileInfo = () => {
  const [isPending, startTransition] = React.useTransition();
  const { data: session } = useSession();

  const logout = async () => {
    startTransition(async () => {
      await signOut();
      window.location.assign("/");
    });
  };


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className=" cursor-pointer">
        <div className=" flex items-center  ">
          <Image
            src={caderhLogoSmall}
            alt=""
            width={36}
            height={36}
            className="rounded-full"
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-0" align="end">
        <DropdownMenuLabel className="flex gap-2 items-center mb-1 p-3">
          <Image
            src={caderhLogoSmall}
            alt=""
            width={36}
            height={36}
            className="rounded-full"
          />
          <div>
            <div className="text-sm font-medium text-default-800">
              {session?.user?.email?.split('@')[0] ?? 'nix'}
            </div>
            <Link
              href="/dashboard/home"
              className="text-xs text-default-600 hover:text-primary"
            >
              {session?.user?.email?.split('@')[1] ? '@' + session?.user?.email?.split('@')[1] : '@nixbiosensors.com'}
            </Link>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {[
            {
              name: "perfil",
              icon: "heroicons:user",
              href: "/dashboard/home"
            },
          ].map((item, index) => (
            <Link
              href={item.href}
              key={`info-menu-${index}`}
              className="cursor-pointer"
            >
              <DropdownMenuItem className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer">
                <Icon icon={item.icon} className="w-4 h-4" />
                {item.name}
              </DropdownMenuItem>
            </Link>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="mb-0 dark:bg-background" />
        <DropdownMenuItem
          onSelect={() => logout()}
          className="flex items-center gap-2 text-sm font-medium text-default-600 capitalize my-1 px-3 dark:hover:bg-background cursor-pointer"
        >
          <Icon icon="heroicons:power" className="w-4 h-4" />
          Desconectarse
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
export default ProfileInfo;
