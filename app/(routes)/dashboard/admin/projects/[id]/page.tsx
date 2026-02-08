"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { InputGroup, InputGroupText } from "@/components/ui/input-group";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
    Calendar,
    CalendarRange,
    DollarSign,
    TrendingUp,
    Pencil,
    Trash2,
    PlusCircle,
    Download,
} from "lucide-react";
import { dateToString, formatCurrency, prettifyNumber } from "@/app/libs/utils";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";

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
            if (!isNaN(parsed)) onChange(String(parsed));
            else onChange("");
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

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const Page = () => {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const { data: session } = useSession() as any;
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [financingSources, setFinancingSources] = useState<any[]>([]);
    const [donations, setDonations] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [allFinancingSources, setAllFinancingSources] = useState<any[]>([]);

    const [infoEditing, setInfoEditing] = useState(false);
    const [infoForm, setInfoForm] = useState({ name: "", description: "", objectives: "", start_date: "", end_date: "" });
    const [infoSaving, setInfoSaving] = useState(false);

    const [addSourceOpen, setAddSourceOpen] = useState(false);
    const [addSourceForm, setAddSourceForm] = useState({ financing_source_id: "", amount: "", description: "" });
    const [addSourceSaving, setAddSourceSaving] = useState(false);

    const [addDonationOpen, setAddDonationOpen] = useState(false);
    const [addDonationForm, setAddDonationForm] = useState({ amount: "", donation_type: "CASH", description: "" });
    const [addDonationSaving, setAddDonationSaving] = useState(false);

    const [addExpenseOpen, setAddExpenseOpen] = useState(false);
    const [addExpenseForm, setAddExpenseForm] = useState({ amount: "", description: "" });
    const [addExpenseSaving, setAddExpenseSaving] = useState(false);

    const [fileUploading, setFileUploading] = useState(false);
    const [fileDescription, setFileDescription] = useState("");
    const [fileFilename, setFileFilename] = useState("");

    const fetchProject = async () => {
        if (!id || !session) return;
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/projects/${id}`,
                { headers: { Authorization: `Bearer ${session?.user?.session}` } }
            );
            if (res.ok) {
                const json = await res.json();
                setProject(json.data);
                setInfoForm({
                    name: json.data.name ?? "",
                    description: json.data.description ?? "",
                    objectives: json.data.objectives ?? "",
                    start_date: json.data.start_date ? json.data.start_date.slice(0, 10) : "",
                    end_date: json.data.end_date ? json.data.end_date.slice(0, 10) : "",
                });
            } else {
                const json = await res.json();
                toast.error(json.message ?? "Proyecto no encontrado");
                router.push("/dashboard/admin/projects");
            }
        } catch {
            toast.error("Error al cargar proyecto");
            router.push("/dashboard/admin/projects");
        } finally {
            setLoading(false);
        }
    };

    const fetchStep2 = async () => {
        if (!id || !session) return;
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/wizard/step2/${id}`,
            { headers: { Authorization: `Bearer ${session?.user?.session}` } }
        );
        if (res.ok) {
            const json = await res.json();
            setFinancingSources(json.data ?? []);
        }
    };

    const fetchStep3 = async () => {
        if (!id || !session) return;
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/wizard/step3/${id}`,
            { headers: { Authorization: `Bearer ${session?.user?.session}` } }
        );
        if (res.ok) {
            const json = await res.json();
            setDonations(json.data ?? []);
        }
    };

    const fetchStep4 = async () => {
        if (!id || !session) return;
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/wizard/step4/${id}`,
            { headers: { Authorization: `Bearer ${session?.user?.session}` } }
        );
        if (res.ok) {
            const json = await res.json();
            setExpenses(json.data ?? []);
        }
    };

    const fetchStep5 = async () => {
        if (!id || !session) return;
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/wizard/step5/${id}`,
            { headers: { Authorization: `Bearer ${session?.user?.session}` } }
        );
        if (res.ok) {
            const json = await res.json();
            setFiles(json.data ?? []);
        }
    };

    const fetchFinancingSourcesList = async () => {
        if (!session) return;
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/financing-sources?limit=100&offset=0`,
            { headers: { Authorization: `Bearer ${session?.user?.session}` } }
        );
        if (res.ok) {
            const json = await res.json();
            setAllFinancingSources(json.data ?? []);
        }
    };

    const reloadAll = () => {
        fetchProject();
        fetchStep2();
        fetchStep3();
        fetchStep4();
        fetchStep5();
    };

    useEffect(() => {
        if (session && id) {
            fetchProject();
            fetchFinancingSourcesList();
        }
    }, [session, id]);

    useEffect(() => {
        if (project && id) {
            fetchStep2();
            fetchStep3();
            fetchStep4();
            fetchStep5();
        }
    }, [project?.id, id]);

    const onDeleteProject = async () => {
        setDeleting(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/projects/${id}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${session?.user?.session}` },
                }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success("Proyecto eliminado");
                router.push("/dashboard/admin/projects");
            } else {
                toast.error(json.message ?? "Error al eliminar");
            }
        } catch {
            toast.error("Error al eliminar proyecto");
        }
        setDeleting(false);
        setDeleteDialogOpen(false);
    };

    const onSaveInfo = async () => {
        setInfoSaving(true);
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
                        project_id: id,
                        name: infoForm.name,
                        description: infoForm.description,
                        objectives: infoForm.objectives,
                        start_date: infoForm.start_date,
                        end_date: infoForm.end_date,
                    }),
                }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success("Información guardada");
                setInfoEditing(false);
                fetchProject();
            } else {
                toast.error(json.message ?? "Error al guardar");
            }
        } catch {
            toast.error("Error al guardar");
        }
        setInfoSaving(false);
    };

    const onAddSource = async () => {
        if (!addSourceForm.financing_source_id || !addSourceForm.amount) {
            toast.error("Completa fuente y monto");
            return;
        }
        setAddSourceSaving(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/${id}/financing-source`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                    body: JSON.stringify({
                        financing_source_id: addSourceForm.financing_source_id,
                        amount: Number(addSourceForm.amount),
                        description: addSourceForm.description || "",
                    }),
                }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success("Fuente agregada");
                setAddSourceOpen(false);
                setAddSourceForm({ financing_source_id: "", amount: "", description: "" });
                fetchStep2();
                fetchProject();
            } else {
                toast.error(json.message ?? "Error al agregar");
            }
        } catch {
            toast.error("Error al agregar fuente");
        }
        setAddSourceSaving(false);
    };

    const onDeleteSource = async (sourceId: string) => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/${id}/financing-source/${sourceId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${session?.user?.session}` },
                }
            );
            if (res.ok) {
                toast.success("Fuente eliminada");
                fetchStep2();
                fetchProject();
            } else {
                const json = await res.json();
                toast.error(json.message ?? "Error al eliminar");
            }
        } catch {
            toast.error("Error al eliminar");
        }
    };

    const onAddDonation = async () => {
        if (!addDonationForm.amount || !addDonationForm.donation_type) {
            toast.error("Completa monto y tipo");
            return;
        }
        setAddDonationSaving(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/${id}/donation`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                    body: JSON.stringify({
                        amount: Number(addDonationForm.amount),
                        donation_type: addDonationForm.donation_type,
                        description: addDonationForm.description || "",
                    }),
                }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success("Donación agregada");
                setAddDonationOpen(false);
                setAddDonationForm({ amount: "", donation_type: "CASH", description: "" });
                fetchStep3();
                fetchProject();
            } else {
                toast.error(json.message ?? "Error al agregar");
            }
        } catch {
            toast.error("Error al agregar donación");
        }
        setAddDonationSaving(false);
    };

    const onDeleteDonation = async (donationId: string) => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/${id}/donation/${donationId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${session?.user?.session}` },
                }
            );
            if (res.ok) {
                toast.success("Donación eliminada");
                fetchStep3();
                fetchProject();
            } else {
                const json = await res.json();
                toast.error(json.message ?? "Error al eliminar");
            }
        } catch {
            toast.error("Error al eliminar");
        }
    };

    const onAddExpense = async () => {
        if (!addExpenseForm.amount) {
            toast.error("Completa el monto");
            return;
        }
        setAddExpenseSaving(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/${id}/expense`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                    body: JSON.stringify({
                        amount: Number(addExpenseForm.amount),
                        description: addExpenseForm.description || "",
                    }),
                }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success("Gasto agregado");
                setAddExpenseOpen(false);
                setAddExpenseForm({ amount: "", description: "" });
                fetchStep4();
                fetchProject();
            } else {
                toast.error(json.message ?? "Error al agregar");
            }
        } catch {
            toast.error("Error al agregar gasto");
        }
        setAddExpenseSaving(false);
    };

    const onDeleteExpense = async (expenseId: string) => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/${id}/expense/${expenseId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${session?.user?.session}` },
                }
            );
            if (res.ok) {
                toast.success("Gasto eliminado");
                fetchStep4();
                fetchProject();
            } else {
                const json = await res.json();
                toast.error(json.message ?? "Error al eliminar");
            }
        } catch {
            toast.error("Error al eliminar");
        }
    };

    const uploadFile = async (file: File) => {
        setFileUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("description", fileDescription || file.name);
            if (fileFilename.trim()) fd.append("filename", fileFilename.trim());
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/wizard/step5/${id}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${session?.user?.session}` },
                    body: fd,
                }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success("Archivo subido");
                setFileDescription("");
                setFileFilename("");
                fetchStep5();
                fetchProject();
            } else {
                toast.error(json.message ?? "Error al subir");
            }
        } catch {
            toast.error("Error al subir archivo");
        }
        setFileUploading(false);
    };

    const deleteFile = async (fileId: string) => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/wizard/step5/${id}/${fileId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${session?.user?.session}` },
                }
            );
            if (res.ok) {
                toast.success("Archivo eliminado");
                fetchStep5();
                fetchProject();
            } else {
                const json = await res.json();
                toast.error(json.message ?? "Error al eliminar");
            }
        } catch {
            toast.error("Error al eliminar");
        }
    };

    const downloadFile = async (fileId: string, filename: string) => {
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/${id}/file/${fileId}/download`,
                { headers: { Authorization: `Bearer ${session?.user?.session}` } }
            );
            if (!res.ok) {
                toast.error("Error al descargar");
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename || "archivo";
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Error al descargar");
        }
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
        disabled: fileUploading || !id,
        onDrop: (accepted) => {
            if (accepted[0]) uploadFile(accepted[0]);
        },
        onDropRejected: (rejections) => {
            const err = rejections[0]?.errors[0];
            if (err?.code === "file-too-large") toast.error("Máx. 10MB");
            else if (err?.code === "file-invalid-type") toast.error("Tipos: pdf, docx, xlsx, jpg, png");
            else toast.error(err?.message ?? "Archivo rechazado");
        },
    });

    if (loading || !project) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
        );
    }

    const financed = Number(project.financed_amount ?? 0);
    const totalExpenses = Number(project.total_expenses ?? 0);
    const executedPct = financed > 0 ? Math.min(100, Math.round((totalExpenses / financed) * 100)) : 0;
    const remaining = Math.max(0, financed - totalExpenses);
    const progressColor = executedPct >= 90 ? "destructive" : executedPct >= 70 ? "warning" : "success";
    const totalFuentes = financingSources.reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const totalDonaciones = donations.reduce((s, r) => s + Number(r.amount ?? 0), 0);
    const totalGastos = expenses.reduce((s, r) => s + Number(r.amount ?? 0), 0);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Administración</BreadcrumbItem>
                    <BreadcrumbItem asChild>
                        <Link href="/dashboard/admin/projects">Proyectos</Link>
                    </BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Detalle del Proyecto</BreadcrumbItem>
                </Breadcrumbs>
                <Button
                    color="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={deleting}
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Proyecto
                </Button>
            </div>

            <Card className="mb-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr]">
                    <div className="flex flex-col p-6 pr-6 lg:pr-8">
                        <h3 className="text-xl font-medium leading-none break-words">{project.name}</h3>
                        <p className="text-sm text-muted-foreground mt-2 break-words flex-1">
                            {project.description}
                        </p>
                        <div className="flex justify-between items-center mt-4 pt-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 shrink-0" />
                                Inicio: {project.start_date ? dateToString(new Date(project.start_date)) : "-"}
                            </span>
                            <span className="flex items-center gap-2">
                                <CalendarRange className="h-4 w-4 shrink-0" />
                                Fin: {project.end_date ? dateToString(new Date(project.end_date)) : "-"}
                            </span>
                        </div>
                    </div>
                    <div className="hidden lg:flex flex-col justify-end bg-transparent">
                        <div className="w-px bg-border h-[100px] mt-[25px] mb-[25px]" />
                    </div>
                    <div className="p-6 pl-6 lg:pl-8 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-success" />
                                <span className="text-muted-foreground">Monto Financiado</span>
                            </div>
                            <span className="font-medium">{formatCurrency(financed)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-warning" />
                                <span className="text-muted-foreground">Total de Gasto</span>
                            </div>
                            <span className="font-medium">{formatCurrency(totalExpenses)}</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Ejecutado: {executedPct}%</span>
                                <span>Restante: {formatCurrency(remaining)}</span>
                            </div>
                            <Progress value={executedPct} color={progressColor} size="sm" />
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <Tabs defaultValue="fuentes" className="w-full">
                    <TabsList className="w-full justify-start gap-8 border-b border-default-200 rounded-none bg-transparent p-0 h-auto min-h-0 px-6 pt-4 pb-0">
                        <TabsTrigger
                            value="info"
                            className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 -mb-px shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            General
                        </TabsTrigger>
                        <TabsTrigger
                            value="fuentes"
                            className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 -mb-px shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            Fuentes
                        </TabsTrigger>
                        <TabsTrigger
                            value="donaciones"
                            className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 -mb-px shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            Donaciones
                        </TabsTrigger>
                        <TabsTrigger
                            value="gastos"
                            className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 -mb-px shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            Gastos
                        </TabsTrigger>
                        <TabsTrigger
                            value="archivos"
                            className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 -mb-px shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            Archivos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex flex-row items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold">Información General del Proyecto</h3>
                            {!infoEditing ? (
                                <Button onClick={() => setInfoEditing(true)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setInfoEditing(false)}>
                                        Cancelar
                                    </Button>
                                    <Button onClick={onSaveInfo} disabled={infoSaving}>
                                        {infoSaving ? "Guardando..." : "Guardar"}
                                    </Button>
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            {!infoEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-muted-foreground">Nombre del Proyecto *</Label>
                                        <p className="mt-1">{project.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Descripción *</Label>
                                        <p className="mt-1 whitespace-pre-line">{project.description}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Objetivos *</Label>
                                        <p className="mt-1 whitespace-pre-line">{project.objectives}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Fecha de Inicio *</Label>
                                        <p className="mt-1">
                                            {project.start_date ? dateToString(new Date(project.start_date)) : "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Fecha de Finalización *</Label>
                                        <p className="mt-1">
                                            {project.end_date ? dateToString(new Date(project.end_date)) : "-"}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <Label>Nombre del Proyecto *</Label>
                                        <Input
                                            value={infoForm.name}
                                            onChange={(e) => setInfoForm((p) => ({ ...p, name: e.target.value }))}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Descripción *</Label>
                                        <Textarea
                                            value={infoForm.description}
                                            onChange={(e) => setInfoForm((p) => ({ ...p, description: e.target.value }))}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Objetivos *</Label>
                                        <Textarea
                                            value={infoForm.objectives}
                                            onChange={(e) => setInfoForm((p) => ({ ...p, objectives: e.target.value }))}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Fecha de Inicio *</Label>
                                            <Input
                                                type="date"
                                                value={infoForm.start_date}
                                                onChange={(e) => setInfoForm((p) => ({ ...p, start_date: e.target.value }))}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Fecha de Finalización *</Label>
                                            <Input
                                                type="date"
                                                value={infoForm.end_date}
                                                onChange={(e) => setInfoForm((p) => ({ ...p, end_date: e.target.value }))}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="fuentes" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex flex-row items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-semibold">Fuentes de Financiamiento</h3>
                                <span className="text-sm text-muted-foreground">
                                    Total: {formatCurrency(totalFuentes)}
                                </span>
                            </div>
                            <Button onClick={() => setAddSourceOpen(true)} color="success">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Agregar Fuente
                            </Button>
                        </div>
                        {financingSources.length === 0 ? (
                                <p className="text-muted-foreground py-8 text-center">
                                    No hay fuentes. Agrega una para comenzar.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Monto</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {financingSources.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell>{r.financing_source_name ?? "-"}</TableCell>
                                                <TableCell>{formatCurrency(Number(r.amount ?? 0))}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => onDeleteSource(r.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                    </TabsContent>

                    <TabsContent value="donaciones" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex flex-row items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-semibold">Donaciones Recibidas</h3>
                                <span className="text-sm text-muted-foreground">
                                    Total: {formatCurrency(totalDonaciones)}
                                </span>
                            </div>
                            <Button onClick={() => setAddDonationOpen(true)} color="success">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Agregar Donación
                            </Button>
                        </div>
                        {donations.length === 0 ? (
                                <p className="text-muted-foreground py-8 text-center">
                                    No hay donaciones. Agrega una para comenzar.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Donante / Descripción</TableHead>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Monto</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {donations.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell>{r.description || "-"}</TableCell>
                                                <TableCell>{r.donation_type === "CASH" ? "Efectivo" : "Suministros"}</TableCell>
                                                <TableCell>{formatCurrency(Number(r.amount ?? 0))}</TableCell>
                                                <TableCell>
                                                    {r.created_dt ? dateToString(new Date(r.created_dt)) : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => onDeleteDonation(r.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                    </TabsContent>

                    <TabsContent value="gastos" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex flex-row items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <h3 className="text-lg font-semibold">Gastos del Proyecto</h3>
                                <span className="text-sm text-muted-foreground">
                                    Total: {formatCurrency(totalGastos)}
                                </span>
                            </div>
                            <Button onClick={() => setAddExpenseOpen(true)} color="success">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Agregar Gasto
                            </Button>
                        </div>
                        {expenses.length === 0 ? (
                                <p className="text-muted-foreground py-8 text-center">
                                    No hay gastos. Agrega uno para comenzar.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead>Monto</TableHead>
                                            <TableHead>Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expenses.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell>{r.description || "-"}</TableCell>
                                                <TableCell>{formatCurrency(Number(r.amount ?? 0))}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => onDeleteExpense(r.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                    </TabsContent>

                    <TabsContent value="archivos" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex flex-row items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold">Archivos del Proyecto</h3>
                            <span className="text-sm text-muted-foreground">
                                Arrastra o haz clic en el área inferior para subir
                            </span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label className="mb-2 block">Nombre del archivo (opcional)</Label>
                                <Input
                                    value={fileFilename}
                                    onChange={(e) => setFileFilename(e.target.value)}
                                    placeholder="Nombre con el que se guardará"
                                    disabled={fileUploading}
                                    className="mb-2"
                                />
                                <Label className="mb-2 block">Descripción (opcional)</Label>
                                <Input
                                    value={fileDescription}
                                    onChange={(e) => setFileDescription(e.target.value)}
                                    placeholder="Descripción del archivo"
                                    disabled={fileUploading}
                                    className="mb-4"
                                />
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
                                    <p className="text-sm font-medium mb-1">
                                        {isDragActive ? "Suelta aquí" : isDragReject ? "Tipo no permitido" : "Arrastra archivos o haz clic"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">pdf, docx, xlsx, jpg, png · Máx. 10MB</p>
                                </div>
                            </div>
                            {files.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Archivos subidos ({files.length})</Label>
                                    {files.map((f) => {
                                        const name = typeof f.file === "string" ? f.file.split("/").pop() : f.description || "archivo";
                                        return (
                                            <div
                                                key={f.id}
                                                className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-default-50"
                                            >
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-sm font-medium truncate">{name}</span>
                                                    {f.description && (
                                                        <span className="text-xs text-muted-foreground truncate mt-0.5">
                                                            {f.description}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 shrink-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => downloadFile(f.id, name)}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => deleteFile(f.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar proyecto</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminarán todos los datos del proyecto.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onDeleteProject} color="destructive">
                            {deleting ? "Eliminando..." : "Eliminar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {addSourceOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader className="flex flex-row justify-between">
                            <CardTitle>Agregar Fuente</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setAddSourceOpen(false)}>×</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Fuente</Label>
                                <Select
                                    value={addSourceForm.financing_source_id}
                                    onValueChange={(v) => setAddSourceForm((p) => ({ ...p, financing_source_id: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allFinancingSources.map((fs) => (
                                            <SelectItem key={fs.id} value={fs.id}>{fs.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Monto</Label>
                                <CurrencyInput
                                    value={addSourceForm.amount}
                                    onChange={(v) => setAddSourceForm((p) => ({ ...p, amount: v }))}
                                />
                            </div>
                            <div>
                                <Label>Descripción (opcional)</Label>
                                <Input
                                    value={addSourceForm.description}
                                    onChange={(e) => setAddSourceForm((p) => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setAddSourceOpen(false)}>Cancelar</Button>
                                <Button onClick={onAddSource} disabled={addSourceSaving}>
                                    {addSourceSaving ? "Guardando..." : "Agregar"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {addDonationOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader className="flex flex-row justify-between">
                            <CardTitle>Agregar Donación</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setAddDonationOpen(false)}>×</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Monto</Label>
                                <CurrencyInput
                                    value={addDonationForm.amount}
                                    onChange={(v) => setAddDonationForm((p) => ({ ...p, amount: v }))}
                                />
                            </div>
                            <div>
                                <Label>Tipo</Label>
                                <Select
                                    value={addDonationForm.donation_type}
                                    onValueChange={(v) => setAddDonationForm((p) => ({ ...p, donation_type: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CASH">Efectivo</SelectItem>
                                        <SelectItem value="SUPPLY">Suministros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Donante / Descripción (opcional)</Label>
                                <Input
                                    value={addDonationForm.description}
                                    onChange={(e) => setAddDonationForm((p) => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setAddDonationOpen(false)}>Cancelar</Button>
                                <Button onClick={onAddDonation} disabled={addDonationSaving}>
                                    {addDonationSaving ? "Guardando..." : "Agregar"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {addExpenseOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-full max-w-md mx-4">
                        <CardHeader className="flex flex-row justify-between">
                            <CardTitle>Agregar Gasto</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setAddExpenseOpen(false)}>×</Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Monto</Label>
                                <CurrencyInput
                                    value={addExpenseForm.amount}
                                    onChange={(v) => setAddExpenseForm((p) => ({ ...p, amount: v }))}
                                />
                            </div>
                            <div>
                                <Label>Descripción (opcional)</Label>
                                <Input
                                    value={addExpenseForm.description}
                                    onChange={(e) => setAddExpenseForm((p) => ({ ...p, description: e.target.value }))}
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setAddExpenseOpen(false)}>Cancelar</Button>
                                <Button onClick={onAddExpense} disabled={addExpenseSaving}>
                                    {addExpenseSaving ? "Guardando..." : "Agregar"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default Page;
