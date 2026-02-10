"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupText } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Stepper, Step, StepLabel } from "@/components/ui/steps";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Loader2, PlusCircle, Trash2, Upload, FileText, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { Checkbox } from "@/components/ui/checkbox";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { prettifyNumber } from "@/app/libs/utils";

const CurrencyInput = ({
    value,
    onChange,
    placeholder = "0.00",
    disabled,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [editValue, setEditValue] = useState("");
    const rawValue = value ? String(value).replace(/,/g, "") : "";
    const num = rawValue ? parseFloat(rawValue) : NaN;
    const formatted = rawValue && !isNaN(num) ? prettifyNumber(num, 2) : "";
    const display = isFocused ? editValue : formatted;

    const handleFocus = () => {
        setIsFocused(true);
        setEditValue(rawValue);
    };
    const handleBlur = () => {
        const val = editValue;
        setTimeout(() => {
            const parsed = parseFloat(val.replace(/,/g, ""));
            if (!isNaN(parsed)) {
                onChange(String(parsed));
            } else {
                onChange("");
            }
            setIsFocused(false);
        }, 0);
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^0-9.]/g, "");
        const parts = raw.split(".");
        const sanitized =
            parts.length > 1 ? `${parts[0]}.${parts[1].slice(0, 2)}` : parts[0] || "";
        setEditValue(sanitized);
        onChange(sanitized);
    };

    return (
        <InputGroup className={cn("w-full", className)}>
            <InputGroupText className="rounded-r-none">L</InputGroupText>
            <Input
                type="text"
                inputMode="decimal"
                value={display}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                className="rounded-l-none border-l-0"
            />
        </InputGroup>
    );
};

const STEP1_SCHEMA = z.object({
    name: z.string().min(2, { message: "Nombre muy corto" }),
    description: z.string().min(1, { message: "Requerido" }),
    objectives: z.string().min(1, { message: "Requerido" }),
    start_date: z.string().min(1, { message: "Requerido" }),
    end_date: z.string().min(1, { message: "Requerido" }),
}).refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
    message: "La fecha de fin debe ser mayor o igual a la de inicio",
    path: ["end_date"],
});

const ALLOWED_FILE_TYPES = [".pdf", ".docx", ".xlsx", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const NewProjectModal = ({
    isOpen,
    setIsOpen,
    reloadList,
}: {
    isOpen: boolean;
    setIsOpen: (input: boolean) => void;
    reloadList: () => void;
}) => {
    const { data: session } = useSession() as any;
    const [step, setStep] = useState(1);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 2
    const [financingSources, setFinancingSources] = useState<any[]>([]);
    const [financingItems, setFinancingItems] = useState<
        { financing_source_id: string; amount: string; description: string }[]
    >([{ financing_source_id: "", amount: "", description: "" }]);

    // Step 3
    const [donationItems, setDonationItems] = useState<
        { amount: string; description: string; donation_type: string }[]
    >([{ amount: "", description: "", donation_type: "CASH" }]);

    // Step 4
    const [expenseItems, setExpenseItems] = useState<
        { amount: string; description: string }[]
    >([{ amount: "", description: "" }]);

    // Step 5
    const [uploadedFiles, setUploadedFiles] = useState<
        { id: string; name: string; description: string }[]
    >([]);
    const [fileDescription, setFileDescription] = useState("");
    const [fileFilename, setFileFilename] = useState("");

    // Step 1 - Logros (un logro por defecto para que el usuario pueda iniciar)
    const [accomplishmentItems, setAccomplishmentItems] = useState<
        { text: string; completed: boolean }[]
    >([{ text: "", completed: false }]);
    const logrosEndRef = useRef<HTMLDivElement>(null);
    const fuentesEndRef = useRef<HTMLDivElement>(null);
    const donacionesEndRef = useRef<HTMLDivElement>(null);
    const gastosEndRef = useRef<HTMLDivElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: zodResolver(STEP1_SCHEMA),
        mode: "onSubmit",
        defaultValues: {
            name: "",
            description: "",
            objectives: "",
            start_date: "",
            end_date: "",
        },
    });

    const fetchFinancingSources = async () => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/financing-sources?limit=100&offset=0`,
                {
                    headers: { Authorization: `Bearer ${session?.user?.session}` },
                }
            );
            if (res.ok) {
                const data = await res.json();
                setFinancingSources(data.data ?? []);
            }
        } catch {
            toast.error("Error al cargar fuentes de financiamiento");
        }
    };

    useEffect(() => {
        if (step === 2 && session) {
            fetchFinancingSources();
        }
    }, [step, session]);

    const resetModal = () => {
        setStep(1);
        setProjectId(null);
        setIsSubmitting(false);
        setFinancingItems([
            { financing_source_id: "", amount: "", description: "" },
        ]);
        setDonationItems([{ amount: "", description: "", donation_type: "CASH" }]);
        setExpenseItems([{ amount: "", description: "" }]);
        setUploadedFiles([]);
        setFileDescription("");
        setFileFilename("");
        setAccomplishmentItems([{ text: "", completed: false }]);
        reset();
        reloadList();
    };

    const onStep1 = async (data: any) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/wizard/step1`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                    body: JSON.stringify({
                        ...(projectId && { project_id: projectId }),
                        name: data.name,
                        description: data.description,
                        objectives: data.objectives,
                        start_date: data.start_date,
                        end_date: data.end_date,
                        accomplishments: accomplishmentItems
                            .filter((a) => a.text.trim())
                            .map((a) => ({
                                text: a.text.trim(),
                                completed: a.completed,
                            })),
                    }),
                }
            );
            const json = await res.json();
            if (res.ok) {
                setProjectId(json.project_id);
                setStep(2);
            } else {
                toast.error(json.message ?? "Error al crear proyecto");
            }
        } catch {
            toast.error("Error al crear proyecto");
        }
        setIsSubmitting(false);
    };

    const onStep2 = async () => {
        const valid = financingItems.filter(
            (i) => i.financing_source_id && i.amount && !isNaN(Number(i.amount))
        );
        if (valid.length === 0) {
            toast.error("Agrega al menos una fuente de financiamiento válida");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/wizard/step2/${projectId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                    body: JSON.stringify({
                        items: valid.map((i) => ({
                            financing_source_id: i.financing_source_id,
                            amount: Number(i.amount),
                            description: i.description || "",
                        })),
                    }),
                }
            );
            const json = await res.json();
            if (res.ok) {
                setStep(3);
            } else {
                toast.error(json.message ?? "Error al guardar fuentes");
            }
        } catch {
            toast.error("Error al guardar fuentes");
        }
        setIsSubmitting(false);
    };

    const onStep3 = async () => {
        const valid = donationItems.filter(
            (i) => i.amount && !isNaN(Number(i.amount)) && i.donation_type
        );
        if (valid.length === 0) {
            toast.error("Agrega al menos una donación válida");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/wizard/step3/${projectId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                    body: JSON.stringify({
                        items: valid.map((i) => ({
                            amount: Number(i.amount),
                            description: i.description || "",
                            donation_type: i.donation_type,
                        })),
                    }),
                }
            );
            const json = await res.json();
            if (res.ok) {
                setStep(4);
            } else {
                toast.error(json.message ?? "Error al guardar donaciones");
            }
        } catch {
            toast.error("Error al guardar donaciones");
        }
        setIsSubmitting(false);
    };

    const onStep4 = async () => {
        const valid = expenseItems.filter(
            (i) => i.amount && !isNaN(Number(i.amount))
        );
        if (valid.length === 0) {
            toast.error("Agrega al menos un gasto válido");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/wizard/step4/${projectId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                    body: JSON.stringify({
                        items: valid.map((i) => ({
                            amount: Number(i.amount),
                            description: i.description || "",
                        })),
                    }),
                }
            );
            const json = await res.json();
            if (res.ok) {
                setStep(5);
            } else {
                toast.error(json.message ?? "Error al guardar gastos");
            }
        } catch {
            toast.error("Error al guardar gastos");
        }
        setIsSubmitting(false);
    };

    const uploadFile = async (file: File) => {
        setIsSubmitting(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("description", fileDescription || file.name);
            if (fileFilename.trim()) {
                fd.append("filename", fileFilename.trim());
            }
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/wizard/step5/${projectId}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${session?.user?.session}` },
                    body: fd,
                }
            );
            const json = await res.json();
            if (res.ok) {
                const ext = file.name.includes(".")
                    ? file.name.slice(file.name.lastIndexOf("."))
                    : "";
                const displayName =
                    fileFilename.trim()
                        ? fileFilename.includes(".")
                            ? fileFilename
                            : fileFilename + ext
                        : file.name;
                const description = fileDescription || file.name;
                setUploadedFiles((prev) => [
                    ...prev,
                    { id: json.file_id, name: displayName, description },
                ]);
                setFileDescription("");
                setFileFilename("");
                toast.success(`${displayName} subido correctamente`);
            } else {
                toast.error(json.message ?? "Error al subir archivo");
            }
        } catch {
            toast.error("Error al subir archivo");
        }
        setIsSubmitting(false);
    };

    const deleteFile = async (fileId: string) => {
        setIsSubmitting(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/wizard/step5/${projectId}/${fileId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${session?.user?.session}` },
                }
            );
            const json = await res.json();
            if (res.ok) {
                setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
                toast.success("Archivo eliminado");
            } else {
                toast.error(json.message ?? "Error al eliminar archivo");
            }
        } catch {
            toast.error("Error al eliminar archivo");
        }
        setIsSubmitting(false);
    };

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        accept: {
            "application/pdf": [".pdf"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
        },
        maxSize: MAX_FILE_SIZE,
        maxFiles: 1,
        disabled: isSubmitting || !projectId,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles[0]) uploadFile(acceptedFiles[0]);
        },
        onDropRejected: (rejections) => {
            const err = rejections[0]?.errors[0];
            if (err?.code === "file-too-large") {
                toast.error("El archivo excede 10MB");
            } else if (err?.code === "file-invalid-type") {
                toast.error("Tipo no permitido. Use: pdf, docx, xlsx, jpg, png");
            } else {
                toast.error(err?.message ?? "Archivo rechazado");
            }
        },
    });

    const addFinancingItem = () => {
        setFinancingItems((prev) => [
            ...prev,
            { financing_source_id: "", amount: "", description: "" },
        ]);
        setTimeout(
            () =>
                fuentesEndRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                }),
            50
        );
    };
    const removeFinancingItem = (i: number) =>
        setFinancingItems((prev) => prev.filter((_, idx) => idx !== i));
    const updateFinancingItem = (
        i: number,
        field: string,
        value: string
    ) => {
        setFinancingItems((prev) =>
            prev.map((item, idx) =>
                idx === i ? { ...item, [field]: value } : item
            )
        );
    };

    const addDonationItem = () => {
        setDonationItems((prev) => [
            ...prev,
            { amount: "", description: "", donation_type: "CASH" },
        ]);
        setTimeout(
            () =>
                donacionesEndRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                }),
            50
        );
    };
    const removeDonationItem = (i: number) =>
        setDonationItems((prev) => prev.filter((_, idx) => idx !== i));
    const updateDonationItem = (i: number, field: string, value: string) => {
        setDonationItems((prev) =>
            prev.map((item, idx) =>
                idx === i ? { ...item, [field]: value } : item
            )
        );
    };

    const addExpenseItem = () => {
        setExpenseItems((prev) => [...prev, { amount: "", description: "" }]);
        setTimeout(
            () =>
                gastosEndRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                }),
            50
        );
    };
    const removeExpenseItem = (i: number) =>
        setExpenseItems((prev) => prev.filter((_, idx) => idx !== i));
    const updateExpenseItem = (i: number, field: string, value: string) => {
        setExpenseItems((prev) =>
            prev.map((item, idx) =>
                idx === i ? { ...item, [field]: value } : item
            )
        );
    };

    // --- Excel import/export helpers ---
    const [excelImporting, setExcelImporting] = useState(false);

    const downloadExcelTemplate = async (type: "financing-sources" | "donations" | "expenses") => {
        if (!projectId || !session) return;
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/${projectId}/excel/${type}`,
                { headers: { Authorization: `Bearer ${session?.user?.session}` } }
            );
            if (!res.ok) { toast.error("Error al descargar plantilla"); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `plantilla-${type}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Error al descargar plantilla");
        }
    };

    const DONATION_TYPE_MAP: Record<string, string> = {
        EFECTIVO: "CASH", SUMINISTROS: "SUPPLY", CASH: "CASH", SUPPLY: "SUPPLY",
    };

    const importExcelLocal = async (file: File, type: "financing-sources" | "donations" | "expenses") => {
        setExcelImporting(true);
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

            let imported = 0;
            let errorCount = 0;

            if (type === "financing-sources") {
                const items: { financing_source_id: string; amount: string; description: string }[] = [];
                for (const row of jsonRows) {
                    const fsId = String(row["Fuente ID"] ?? "").trim();
                    const monto = Number(row["Monto"]);
                    const desc = String(row["Descripcion"] ?? "").trim();
                    if (!fsId || isNaN(monto)) { errorCount++; continue; }
                    items.push({ financing_source_id: fsId, amount: String(monto), description: desc });
                    imported++;
                }
                if (items.length > 0) setFinancingItems(items);
            } else if (type === "donations") {
                const items: { amount: string; description: string; donation_type: string }[] = [];
                for (const row of jsonRows) {
                    const monto = Number(row["Monto"]);
                    const desc = String(row["Descripcion"] ?? "").trim();
                    const tipoRaw = String(row["Tipo"] ?? "").trim().toUpperCase();
                    const dtype = DONATION_TYPE_MAP[tipoRaw];
                    if (isNaN(monto) || !dtype) { errorCount++; continue; }
                    items.push({ amount: String(monto), description: desc, donation_type: dtype });
                    imported++;
                }
                if (items.length > 0) setDonationItems(items);
            } else if (type === "expenses") {
                const items: { amount: string; description: string }[] = [];
                for (const row of jsonRows) {
                    const monto = Number(row["Monto"]);
                    const desc = String(row["Descripcion"] ?? "").trim();
                    if (isNaN(monto)) { errorCount++; continue; }
                    items.push({ amount: String(monto), description: desc });
                    imported++;
                }
                if (items.length > 0) setExpenseItems(items);
            }

            const msg = `${imported} registros importados${errorCount > 0 ? `, ${errorCount} con errores` : ""}`;
            if (errorCount > 0) toast.error(msg); else toast.success(msg);
        } catch {
            toast.error("Error al leer el archivo Excel");
        }
        setExcelImporting(false);
    };

    const ExcelDropzone = ({ type }: { type: "financing-sources" | "donations" | "expenses" }) => {
        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
            maxFiles: 1,
            maxSize: 10 * 1024 * 1024,
            disabled: excelImporting || !projectId,
            onDrop: (accepted) => { if (accepted[0]) importExcelLocal(accepted[0], type); },
            onDropRejected: () => toast.error("Solo archivos .xlsx de hasta 10MB"),
        });
        return (
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-lg py-8 px-4 text-center cursor-pointer transition-colors text-sm",
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
                )}
            >
                <input {...getInputProps()} />
                {excelImporting ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span>Importando...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Upload className="h-6 w-6" />
                        <span>{isDragActive ? "Suelta el archivo aquí" : "Arrastra un Excel o haz clic para importar"}</span>
                        <span className="text-xs">Solo archivos .xlsx</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(v) => {
                setIsOpen(v);
                resetModal();
            }}
        >
            <DialogContent
                size="5xl"
                className="overflow-y-auto max-h-screen"
                aria-describedby="new-project-modal"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogTitle className="px-2 underline">
                    Crear nuevo proyecto
                </DialogTitle>
                <Stepper
                    direction="horizontal"
                    current={step - 1}
                    gap
                    alternativeLabel
                >
                    <Step>
                        <StepLabel>Información</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Fuentes</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Donaciones</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Gastos</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Archivos</StepLabel>
                    </Step>
                </Stepper>
                <div className="w-full py-6">
                    <ScrollArea className="h-full max-h-[400px]">
                        {step === 1 && (
                            <form
                                onSubmit={handleSubmit(onStep1)}
                                className="px-5"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <Label className="mb-2 font-medium text-default-600">
                                            Nombre
                                        </Label>
                                        <Input
                                            disabled={isSubmitting}
                                            {...register("name")}
                                            placeholder=" "
                                        />
                                        {errors.name && (
                                            <div className="text-destructive mt-1 text-sm">
                                                {errors.name.message}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="mb-2 font-medium text-default-600">
                                            Fecha inicio
                                        </Label>
                                        <Input
                                            disabled={isSubmitting}
                                            type="date"
                                            {...register("start_date")}
                                        />
                                        {errors.start_date && (
                                            <div className="text-destructive mt-1 text-sm">
                                                {errors.start_date.message}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <Label className="mb-2 font-medium text-default-600">
                                            Fecha fin
                                        </Label>
                                        <Input
                                            disabled={isSubmitting}
                                            type="date"
                                            {...register("end_date")}
                                        />
                                        {errors.end_date && (
                                            <div className="text-destructive mt-1 text-sm">
                                                {errors.end_date.message}
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="mb-2 font-medium text-default-600">
                                            Descripción
                                        </Label>
                                        <Textarea
                                            disabled={isSubmitting}
                                            {...register("description")}
                                            placeholder=" "
                                            rows={2}
                                            className="min-h-[60px]"
                                        />
                                        {errors.description && (
                                            <div className="text-destructive mt-1 text-sm">
                                                {errors.description.message}
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="mb-2 font-medium text-default-600">
                                            Objetivos
                                        </Label>
                                        <Textarea
                                            disabled={isSubmitting}
                                            {...register("objectives")}
                                            placeholder=" "
                                            rows={2}
                                            className="min-h-[60px]"
                                        />
                                        {errors.objectives && (
                                            <div className="text-destructive mt-1 text-sm">
                                                {errors.objectives.message}
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label className="mb-2 font-medium text-default-600">
                                            Logros del Proyecto
                                        </Label>
                                        <div className="space-y-2">
                                            {accomplishmentItems.map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="flex gap-2 items-center"
                                                >
                                                    <Checkbox
                                                        checked={item.completed}
                                                        onCheckedChange={(checked) => {
                                                            setAccomplishmentItems((prev) =>
                                                                prev.map((a, j) =>
                                                                    j === i ? { ...a, completed: !!checked } : a
                                                                )
                                                            );
                                                        }}
                                                        disabled={isSubmitting}
                                                    />
                                                    <Input
                                                        disabled={isSubmitting}
                                                        value={item.text}
                                                        onChange={(e) =>
                                                            setAccomplishmentItems((prev) =>
                                                                prev.map((a, j) =>
                                                                    j === i ? { ...a, text: e.target.value } : a
                                                                )
                                                            )
                                                        }
                                                        placeholder="Logro"
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive shrink-0"
                                                        onClick={() =>
                                                            setAccomplishmentItems((prev) =>
                                                                prev.filter((_, j) => j !== i)
                                                            )
                                                        }
                                                        disabled={isSubmitting}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setAccomplishmentItems((prev) => [
                                                        ...prev,
                                                        { text: "", completed: false },
                                                    ]);
                                                    setTimeout(
                                                        () =>
                                                            logrosEndRef.current?.scrollIntoView({
                                                                behavior: "smooth",
                                                                block: "end",
                                                            }),
                                                        50
                                                    );
                                                }}
                                                disabled={isSubmitting}
                                            >
                                                <PlusCircle className="h-4 w-4 mr-2" />
                                                Agregar logro
                                            </Button>
                                            <div ref={logrosEndRef} />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                        {step === 2 && (
                            <div className="px-2">
                                {financingItems.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-2 items-end mb-4"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <Label className="mb-1 text-xs">
                                                Fuente
                                            </Label>
                                            <Select
                                                value={item.financing_source_id || undefined}
                                                onValueChange={(v) =>
                                                    updateFinancingItem(
                                                        i,
                                                        "financing_source_id",
                                                        v
                                                    )
                                                }
                                            >
                                                <SelectTrigger size="md">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[99990]">
                                                    {financingSources.map((fs) => (
                                                        <SelectItem
                                                            key={fs.id}
                                                            value={fs.id}
                                                        >
                                                            {fs.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="min-w-[140px]">
                                            <Label className="mb-1 text-xs">
                                                Monto
                                            </Label>
                                            <CurrencyInput
                                                value={item.amount}
                                                onChange={(v) =>
                                                    updateFinancingItem(
                                                        i,
                                                        "amount",
                                                        v
                                                    )
                                                }
                                                placeholder="0.00"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Label className="mb-1 text-xs">
                                                Descripción
                                            </Label>
                                            <Input
                                                value={item.description}
                                                onChange={(e) =>
                                                    updateFinancingItem(
                                                        i,
                                                        "description",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Opcional"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeFinancingItem(i)}
                                            disabled={financingItems.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between mr-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addFinancingItem}
                                    >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Agrega más
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadExcelTemplate("financing-sources")}
                                        disabled={!projectId}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Plantilla Excel
                                    </Button>
                                </div>
                                <div className="mt-3">
                                    <ExcelDropzone type="financing-sources" />
                                </div>
                                <div ref={fuentesEndRef} />
                            </div>
                        )}
                        {step === 3 && (
                            <div className="px-2">
                                {donationItems.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-2 items-end mb-4"
                                    >
                                        <div className="min-w-[140px]">
                                            <Label className="mb-1 text-xs">
                                                Monto
                                            </Label>
                                            <CurrencyInput
                                                value={item.amount}
                                                onChange={(v) =>
                                                    updateDonationItem(
                                                        i,
                                                        "amount",
                                                        v
                                                    )
                                                }
                                                placeholder="0.00"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Label className="mb-1 text-xs">
                                                Tipo
                                            </Label>
                                            <Select
                                                value={item.donation_type}
                                                onValueChange={(v) =>
                                                    updateDonationItem(
                                                        i,
                                                        "donation_type",
                                                        v
                                                    )
                                                }
                                            >
                                                <SelectTrigger size="md">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="z-[99990]">
                                                    <SelectItem value="CASH">
                                                        Efectivo
                                                    </SelectItem>
                                                    <SelectItem value="SUPPLY">
                                                        Suministros
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Label className="mb-1 text-xs">
                                                Descripción
                                            </Label>
                                            <Input
                                                value={item.description}
                                                onChange={(e) =>
                                                    updateDonationItem(
                                                        i,
                                                        "description",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Opcional"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeDonationItem(i)}
                                            disabled={donationItems.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between mr-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addDonationItem}
                                    >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Agrega más
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadExcelTemplate("donations")}
                                        disabled={!projectId}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Plantilla Excel
                                    </Button>
                                </div>
                                <div className="mt-3">
                                    <ExcelDropzone type="donations" />
                                </div>
                                <div ref={donacionesEndRef} />
                            </div>
                        )}
                        {step === 4 && (
                            <div className="px-2">
                                {expenseItems.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-2 items-end mb-4"
                                    >
                                        <div className="min-w-[140px]">
                                            <Label className="mb-1 text-xs">
                                                Monto
                                            </Label>
                                            <CurrencyInput
                                                value={item.amount}
                                                onChange={(v) =>
                                                    updateExpenseItem(
                                                        i,
                                                        "amount",
                                                        v
                                                    )
                                                }
                                                placeholder="0.00"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Label className="mb-1 text-xs">
                                                Descripción
                                            </Label>
                                            <Input
                                                value={item.description}
                                                onChange={(e) =>
                                                    updateExpenseItem(
                                                        i,
                                                        "description",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Opcional"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeExpenseItem(i)}
                                            disabled={expenseItems.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <div className="flex items-center justify-between mr-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addExpenseItem}
                                    >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Agrega más
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => downloadExcelTemplate("expenses")}
                                        disabled={!projectId}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Plantilla Excel
                                    </Button>
                                </div>
                                <div className="mt-3">
                                    <ExcelDropzone type="expenses" />
                                </div>
                                <div ref={gastosEndRef} />
                            </div>
                        )}
                        {step === 5 && (
                            <div className="px-4 pr-6 space-y-4">
                                <div>
                                    <Label className="mb-2 text-xs font-medium text-default-600">
                                        Nombre del archivo (opcional)
                                    </Label>
                                    <Input
                                        value={fileFilename}
                                        onChange={(e) =>
                                            setFileFilename(e.target.value)
                                        }
                                        placeholder="Nombre con el que se guardará (si no se indica, se usa el original)"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div>
                                    <Label className="mb-2 text-xs font-medium text-default-600">
                                        Descripción del archivo (opcional)
                                    </Label>
                                    <Input
                                        value={fileDescription}
                                        onChange={(e) =>
                                            setFileDescription(e.target.value)
                                        }
                                        placeholder="Se usará el nombre del archivo si se deja vacío"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                                        "hover:border-primary/50 hover:bg-primary/5",
                                        isDragActive && "border-primary bg-primary/10",
                                        isDragReject && "border-destructive bg-destructive/10",
                                        !isDragActive && !isDragReject && "border-default-300"
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                                    <p className="text-sm font-medium text-default-600 mb-1">
                                        {isDragActive
                                            ? "Suelta el archivo aquí"
                                            : isDragReject
                                                ? "Tipo de archivo no permitido"
                                                : "Arrastra un archivo o haz clic para seleccionar"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        pdf, docx, xlsx, jpg, png · Máx. 10MB
                                    </p>
                                </div>
                                {uploadedFiles.length > 0 && (
                                    <div>
                                        <Label className="mb-2 text-xs font-medium text-default-600">
                                            Archivos subidos ({uploadedFiles.length})
                                        </Label>
                                        <div className="flex flex-col gap-3">
                                            {uploadedFiles.map((f) => (
                                                <div
                                                    key={f.id}
                                                    className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-default-200 bg-default-50"
                                                >
                                                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
                                                    <div className="flex-1 min-w-0 overflow-hidden">
                                                        <p
                                                            className="text-sm font-medium text-default-800 truncate"
                                                            title={f.name}
                                                        >
                                                            {f.name}
                                                        </p>
                                                        <p
                                                            className="text-xs text-muted-foreground mt-0.5 truncate"
                                                            title={f.description}
                                                        >
                                                            {f.description || "—"}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 shrink-0 ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => deleteFile(f.id)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </div>
                <DialogFooter className="min-h-[40px]">
                    {step === 1 && (
                        <>
                            <Button
                                type="button"
                                color="dark"
                                onClick={() => {
                                    setIsOpen(false);
                                    resetModal();
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                color="success"
                                disabled={isSubmitting}
                                onClick={handleSubmit(onStep1)}
                            >
                                {isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Siguiente
                            </Button>
                        </>
                    )}
                    {step === 2 && (
                        <>
                            <Button
                                type="button"
                                color="dark"
                                onClick={() => setStep(1)}
                                disabled={isSubmitting}
                            >
                                Anterior
                            </Button>
                            <Button
                                type="button"
                                color="success"
                                disabled={isSubmitting}
                                onClick={onStep2}
                            >
                                {isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Siguiente
                            </Button>
                        </>
                    )}
                    {step === 3 && (
                        <>
                            <Button
                                type="button"
                                color="dark"
                                onClick={() => setStep(2)}
                                disabled={isSubmitting}
                            >
                                Anterior
                            </Button>
                            <Button
                                type="button"
                                color="success"
                                disabled={isSubmitting}
                                onClick={onStep3}
                            >
                                {isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Siguiente
                            </Button>
                        </>
                    )}
                    {step === 4 && (
                        <>
                            <Button
                                type="button"
                                color="dark"
                                onClick={() => setStep(3)}
                                disabled={isSubmitting}
                            >
                                Anterior
                            </Button>
                            <Button
                                type="button"
                                color="success"
                                disabled={isSubmitting}
                                onClick={onStep4}
                            >
                                {isSubmitting && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Siguiente
                            </Button>
                        </>
                    )}
                    {step === 5 && (
                        <>
                            <Button
                                type="button"
                                color="dark"
                                onClick={() => setStep(4)}
                                disabled={isSubmitting}
                            >
                                Anterior
                            </Button>
                            <DialogClose asChild>
                                <Button color="success">Finalizar</Button>
                            </DialogClose>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NewProjectModal;
