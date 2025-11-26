"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";


interface CardSnippetProps {
  title?: string;
  children: React.ReactNode
  code?: string;
}
const CardSnippet = ({ title, code, children }: CardSnippetProps) => {
  const [show, setShow] = useState(false);
  const toggle = () => {
    setShow(!show);
  };
  const { theme: mode } = useTheme();


  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        {title && (
          <CardTitle className="flex-1 leading-normal"> {title}</CardTitle>
        )}
        {code && (
          <div className="flex-none">
            <Switch id="airplane-mode" onClick={toggle} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

export default CardSnippet;
