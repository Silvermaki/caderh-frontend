import React, { useEffect, useState } from "react";
import { Bell } from "@/components/svg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const NotificationMessage = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const getNotis = async () => {
    setLoading(true);
    const params = new URLSearchParams('');
    const response = await (await fetch(`/api/nix-pro/notifications?${params.toString()}`, {
      method: 'GET',
    })).json();
    setNotifications(response.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    getNotis();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative md:h-9 md:w-9 h-8 w-8 hover:bg-default-100 dark:hover:bg-default-200 
          data-[state=open]:bg-default-100  dark:data-[state=open]:bg-default-200 
           hover:text-primary text-default-500 dark:text-default-800  rounded-full  "
        >
          <Bell className="h-5 w-5 " />
          <Badge className=" w-4 h-4 p-0 text-xs  font-medium  items-center justify-center absolute left-[calc(100%-18px)] bottom-[calc(100%-16px)] ring-2 ring-primary-foreground">
            {notifications.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className=" z-[999] mx-4 lg:w-[412px] p-0"
      >
        <DropdownMenuLabel
          className="w-full h-full bg-cover bg-no-repeat p-4 flex items-center bg-primary"
        >
          <span className="text-base font-semibold text-white flex-1">
            Notificaciones
          </span>
          <span className="text-xs font-medium text-white flex-0 cursor-pointer hover:underline hover:decoration-default-100 dark:decoration-default-900">
          </span>
        </DropdownMenuLabel>
        <div className="h-[300px] xl:h-[350px]">
          <ScrollArea className="h-full">
            {notifications.map((item: any, index) => (
              <DropdownMenuItem
                key={`inbox-${index}`}
                className="flex gap-9 py-2 px-4"
              >
                {+item.expires_in > 0 &&
                  <div className="p-3 bg-[#FFF1BF] rounded-md w-full text-justify">
                    Test Noti.
                  </div>
                }
              </DropdownMenuItem>
            ))}
            {notifications.length === 0 && <>
              <div className="flex items-center gap-2 justify-center h-[300px] xl:h-[350px]">
                <div className="text-sm font-medium text-default-900 mb-[2px] whitespace-nowrap">
                  No tiene nuevas notificaciones
                </div>
              </div>
            </>}
          </ScrollArea>
        </div>
        <DropdownMenuSeparator />
        <div className="m-4 mt-5">
          <Button className="w-full">
            <Link href="/dashboard/nix-pro/expirations">Ver todas mis notificaciones</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationMessage;
