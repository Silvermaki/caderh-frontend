"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function Error({ error, reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="space-y-4 p-8 mb-4">
      <Alert color="destructive" variant="soft">
        <Info className="h-5 w-5" />
        <AlertDescription>Algo salió mal</AlertDescription>
      </Alert>
      <Button onClick={() => reset()} color="destructive" size="sm">
        Volver
      </Button>
    </div>
  );
}
