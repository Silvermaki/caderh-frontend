import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { dateToString, timeToString } from "@/app/libs/utils";

const BitacoraDetailModal = ({
    log,
    isOpen,
    setIsOpen,
}: {
    log: any;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}) => {
    if (!log) return null;

    const roleLabel =
        log.user_role === "ADMIN"
            ? "Administrador"
            : log.user_role === "MANAGER"
              ? "Supervisor"
              : "Agente";
    const roleBadgeColor =
        log.user_role === "ADMIN" ? "dark" : log.user_role === "MANAGER" ? "warning" : "default";

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent size="2xl">
                <DialogHeader>
                    <DialogTitle>Detalle de Bitácora</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <Label className="text-muted-foreground">Fecha</Label>
                            <p className="mt-1">
                                {log.created_dt
                                    ? dateToString(new Date(log.created_dt))
                                    : "-"}
                            </p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Hora</Label>
                            <p className="mt-1">
                                {log.created_dt
                                    ? timeToString(new Date(log.created_dt))
                                    : "-"}
                            </p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Usuario</Label>
                            <p className="mt-1">{log.user_name ?? "-"}</p>
                        </div>
                        <div>
                            <Label className="text-muted-foreground">Rol</Label>
                            <p className="mt-1">
                                <Badge color={roleBadgeColor}>{roleLabel}</Badge>
                            </p>
                        </div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Bitácora</Label>
                        <p className="mt-1 whitespace-pre-line text-sm p-4 rounded-md max-h-[300px] overflow-y-auto">
                            {log.log ?? "-"}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default BitacoraDetailModal;
