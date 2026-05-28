import * as React from "react";
import { DocsLayout } from "@/components/docs/docs-layout";

export const metadata = {
  title: "Centro de Ayuda · CADERH",
};

export default function AyudaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocsLayout>{children}</DocsLayout>;
}
