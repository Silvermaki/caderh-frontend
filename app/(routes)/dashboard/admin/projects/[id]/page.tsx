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
    Target,
    Pencil,
    Trash2,
    PlusCircle,
    Download,
    Upload,
    Loader2,
    Archive,
    ArchiveRestore,
    ChevronsUpDown,
    Check,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { dateToString, formatCurrency, prettifyNumber } from "@/app/libs/utils";
import { Progress } from "@/components/ui/progress";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import ProjectHeader from "@/components/project/ProjectHeader";
import InfoSection from "@/components/project/InfoSection";
import ObjectivesList from "@/components/project/ObjectivesList";
import DatesCard from "@/components/project/DatesCard";
import AchievementsList from "@/components/project/AchievementsList";

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
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
    const [archiving, setArchiving] = useState(false);

    const [financingSources, setFinancingSources] = useState<any[]>([]);
    const [donations, setDonations] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [allFinancingSources, setAllFinancingSources] = useState<any[]>([]);

    const [infoEditing, setInfoEditing] = useState(false);
    const [infoForm, setInfoForm] = useState({
        name: "",
        description: "",
        objectives: "",
        start_date: "",
        end_date: "",
        project_category: "PROJECT",
        accomplishments: [] as { text: string; completed: boolean }[],
    });
    const [infoSaving, setInfoSaving] = useState(false);
    const [accomplishmentsPatching, setAccomplishmentsPatching] = useState(false);

    const [addSourceOpen, setAddSourceOpen] = useState(false);
    const [addSourceForm, setAddSourceForm] = useState({ financing_source_id: "", amount: "", description: "" });
    const [addSourceSaving, setAddSourceSaving] = useState(false);

    const [addDonationOpen, setAddDonationOpen] = useState(false);
    const [addDonationForm, setAddDonationForm] = useState({ amount: "", donation_type: "CASH", description: "" });
    const [addDonationSaving, setAddDonationSaving] = useState(false);

    const [addExpenseOpen, setAddExpenseOpen] = useState(false);
    const [addExpenseForm, setAddExpenseForm] = useState({ amount: "", description: "", expense_category_id: "" });
    const [addExpenseSaving, setAddExpenseSaving] = useState(false);

    const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [creatingCategory, setCreatingCategory] = useState(false);

    const [fileUploading, setFileUploading] = useState(false);
    const [fileDescription, setFileDescription] = useState("");
    const [fileFilename, setFileFilename] = useState("");

    const [agents, setAgents] = useState<any[]>([]);
    const [assigningAgent, setAssigningAgent] = useState(false);

    const [projectLogs, setProjectLogs] = useState<any[]>([]);
    const [logsCount, setLogsCount] = useState(0);
    const [logsOffset, setLogsOffset] = useState(0);
    const [logsLoading, setLogsLoading] = useState(false);
    const logsLimit = 10;

    const userRole = session?.user?.role;
    const userId = session?.user?.id;

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
                const acc = json.data.accomplishments;
                const accArr = Array.isArray(acc)
                    ? acc
                          .filter((a: any) => a && typeof a.text === "string")
                          .map((a: any) => ({
                              text: String(a.text),
                              completed: Boolean(a?.completed),
                          }))
                    : [];
                setInfoForm({
                    name: json.data.name ?? "",
                    description: json.data.description ?? "",
                    objectives: json.data.objectives ?? "",
                    start_date: json.data.start_date ? json.data.start_date.slice(0, 10) : "",
                    end_date: json.data.end_date ? json.data.end_date.slice(0, 10) : "",
                    project_category: json.data.project_category ?? "PROJECT",
                    accomplishments: accArr,
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

    const fetchExpenseCategories = async () => {
        if (!session) return;
        const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/expense-categories`,
            { headers: { Authorization: `Bearer ${session?.user?.session}` } }
        );
        if (res.ok) {
            const json = await res.json();
            setExpenseCategories(json.data ?? []);
        }
    };

    const onCreateCategory = async () => {
        if (!newCategoryName.trim()) return;
        setCreatingCategory(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/expense-categories`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                    body: JSON.stringify({ name: newCategoryName.trim() }),
                }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success("Categoría creada");
                setNewCategoryName("");
                fetchExpenseCategories();
                setAddExpenseForm((p) => ({ ...p, expense_category_id: json.id }));
            } else {
                toast.error(json.message ?? "Error al crear categoría");
            }
        } catch {
            toast.error("Error al crear categoría");
        }
        setCreatingCategory(false);
    };

    const fetchAgents = async () => {
        if (!session || userRole === 'USER') return;
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/agents`,
                { headers: { Authorization: `Bearer ${session?.user?.session}` } }
            );
            if (res.ok) {
                const json = await res.json();
                setAgents(json.data ?? []);
            }
        } catch { }
    };

    const fetchProjectLogs = async (offsetVal = 0) => {
        if (!id || !session) return;
        setLogsLoading(true);
        try {
            const params = new URLSearchParams({
                limit: String(logsLimit),
                offset: String(offsetVal),
            });
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/projects/${id}/logs?${params}`,
                { headers: { Authorization: `Bearer ${session?.user?.session}` } }
            );
            if (res.ok) {
                const json = await res.json();
                setProjectLogs(json.data ?? []);
                setLogsCount(json.count ?? 0);
            }
        } catch { }
        setLogsLoading(false);
    };

    const onAssignAgents = async (agentIds: string[]) => {
        setAssigningAgent(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/projects/${id}/assign`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                    body: JSON.stringify({ agent_ids: agentIds }),
                }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success("Agentes actualizados");
                fetchProject();
            } else {
                toast.error(json.message ?? "Error al asignar agentes");
            }
        } catch {
            toast.error("Error al asignar agentes");
        }
        setAssigningAgent(false);
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
            fetchExpenseCategories();
            fetchAgents();
        }
    }, [session, id]);

    useEffect(() => {
        if (project && id) {
            fetchStep2();
            fetchStep3();
            fetchStep4();
            fetchStep5();
            fetchProjectLogs();
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

    const isArchived = project?.project_status === "ARCHIVED";

    // --- Excel import/export ---
    const [excelImporting, setExcelImporting] = useState(false);

    const downloadExcelTemplate = async (type: "financing-sources" | "donations" | "expenses") => {
        if (!id || !session) return;
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/${id}/excel/${type}`,
                { headers: { Authorization: `Bearer ${(session as any)?.user?.session}` } }
            );
            if (!res.ok) { toast.error("Error al descargar plantilla"); return; }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const fileNames: Record<string, string> = {
                "financing-sources": "plantilla-fuentes",
                "donations": "plantilla-donaciones",
                "expenses": "plantilla-gastos",
            };
            a.download = `${fileNames[type] ?? `plantilla-${type}`}.xlsx`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error("Error al descargar plantilla");
        }
    };

    const importExcelFile = async (file: File, type: "financing-sources" | "donations" | "expenses") => {
        if (!id || !session) return;
        setExcelImporting(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/project/${id}/excel/${type}`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${(session as any)?.user?.session}` },
                    body: fd,
                }
            );
            const json = await res.json();
            if (res.ok) {
                const msg = `${json.processed} procesados${json.errors > 0 ? `, ${json.errors} con errores` : ""}`;
                if (json.errors > 0) toast.error(msg); else toast.success(msg);
                // Refresh data
                if (type === "financing-sources") fetchStep2();
                else if (type === "donations") fetchStep3();
                else if (type === "expenses") fetchStep4();
                fetchProject();
            } else {
                toast.error(json.message ?? "Error al importar");
            }
        } catch {
            toast.error("Error al importar archivo");
        }
        setExcelImporting(false);
    };

    const onArchiveProject = async () => {
        setArchiving(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/projects/${id}/archive`,
                {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${session?.user?.session}` },
                }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success(isArchived ? "Proyecto desarchivado" : "Proyecto archivado");
                fetchProject();
            } else {
                toast.error(json.message ?? (isArchived ? "Error al desarchivar" : "Error al archivar"));
            }
        } catch {
            toast.error(isArchived ? "Error al desarchivar proyecto" : "Error al archivar proyecto");
        }
        setArchiving(false);
        setArchiveDialogOpen(false);
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
                        project_category: infoForm.project_category,
                        accomplishments: infoForm.accomplishments.map((a) => ({
                            text: a.text,
                            completed: a.completed,
                        })),
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

    const onPatchAccomplishments = async (accomplishments: { text: string; completed: boolean }[]) => {
        setAccomplishmentsPatching(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/projects/${id}/accomplishments`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session?.user?.session}`,
                    },
                    body: JSON.stringify({ accomplishments }),
                }
            );
            const json = await res.json();
            if (res.ok) {
                fetchProject();
                setInfoForm((p) => ({ ...p, accomplishments }));
            } else {
                toast.error(json.message ?? "Error al actualizar logros");
            }
        } catch {
            toast.error("Error al actualizar logros");
        }
        setAccomplishmentsPatching(false);
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
                        expense_category_id: addExpenseForm.expense_category_id || null,
                    }),
                }
            );
            const json = await res.json();
            if (res.ok) {
                toast.success("Gasto agregado");
                setAddExpenseOpen(false);
                setAddExpenseForm({ amount: "", description: "", expense_category_id: "" });
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
    const inKindDonations = donations
        .filter((d: any) => String(d.donation_type).toUpperCase() === "SUPPLY")
        .reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    const cashDonations = donations
        .filter((d: any) => String(d.donation_type).toUpperCase() === "CASH")
        .reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    const benefitDonations = donations
        .filter((d: any) => String(d.donation_type).toUpperCase() === "BENEFIT")
        .reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);

    const isSupervisor = userRole === 'ADMIN' || userRole === 'MANAGER';
    const canEdit = isSupervisor || (userRole === 'USER' && Array.isArray(project?.assigned_agents) && project.assigned_agents.some((a: any) => a.id === userId));

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
                <Breadcrumbs>
                    <BreadcrumbItem>Plataforma</BreadcrumbItem>
                    <BreadcrumbItem>Administración</BreadcrumbItem>
                    <BreadcrumbItem asChild>
                        <Link href="/dashboard/admin/projects">Proyectos</Link>
                    </BreadcrumbItem>
                    <BreadcrumbItem className="text-primary">Detalle del Proyecto</BreadcrumbItem>
                </Breadcrumbs>
                <div className="flex gap-2 items-center">
                    {isSupervisor && (project?.project_status === "ACTIVE" || project?.project_status === "ARCHIVED") && (
                        <Button
                            variant="outline"
                            onClick={() => setArchiveDialogOpen(true)}
                            disabled={archiving}
                        >
                            {isArchived
                                ? <><ArchiveRestore className="h-4 w-4 mr-2" />Desarchivar Proyecto</>
                                : <><Archive className="h-4 w-4 mr-2" />Archivar Proyecto</>
                            }
                        </Button>
                    )}
                    {isSupervisor && (
                        <Button
                            color="destructive"
                            onClick={() => setDeleteDialogOpen(true)}
                            disabled={deleting}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar Proyecto
                        </Button>
                    )}
                </div>
            </div>

            {!canEdit && userRole === 'USER' && (
                <div className="mb-4 p-3 rounded-md bg-white border border-default-200 text-gray-400 text-sm dark:bg-default-950 dark:border-default-800 dark:text-default-300">
                    Tienes acceso de solo lectura a este proyecto. Para editarlo, un supervisor debe asignarte como agente.
                </div>
            )}

            <ProjectHeader
                name={project.name}
                description={project.description}
                startDate={project.start_date}
                endDate={project.end_date}
                accomplishments={project.accomplishments}
                financed={financed}
                totalExpenses={totalExpenses}
                remaining={remaining}
                executedPct={executedPct}
                progressColor={progressColor}
                inKindDonations={inKindDonations}
                cashDonations={cashDonations}
                projectCategory={project.project_category}
            />

            <Card>
                <Tabs defaultValue="info" className="w-full">
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
                        <TabsTrigger
                            value="bitacora"
                            className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 -mb-px shadow-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            Bitácora
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex flex-row items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold">Información General del Proyecto</h3>
                            {!infoEditing ? (
                                canEdit && <Button onClick={() => setInfoEditing(true)}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Editar
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const acc = project?.accomplishments;
                                            const accArr = Array.isArray(acc)
                                                ? acc
                                                      .filter((a: any) => a && typeof a.text === "string")
                                                      .map((a: any) => ({
                                                          text: String(a.text),
                                                          completed: Boolean(a?.completed),
                                                      }))
                                                : [];
                                            setInfoForm({
                                                name: project?.name ?? "",
                                                description: project?.description ?? "",
                                                objectives: project?.objectives ?? "",
                                                start_date: project?.start_date ? String(project.start_date).slice(0, 10) : "",
                                                end_date: project?.end_date ? String(project.end_date).slice(0, 10) : "",
                                                project_category: project?.project_category ?? "PROJECT",
                                                accomplishments: accArr,
                                            });
                                            setInfoEditing(false);
                                        }}
                                    >
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
                                <div className="space-y-8">
                                    {/* Objectives */}
                                    <InfoSection title="Objetivos">
                                        <ObjectivesList objectives={project.objectives} />
                                    </InfoSection>

                                    {/* Dates */}
                                    <InfoSection title="Fechas del Proyecto">
                                        <DatesCard
                                            startDate={project.start_date}
                                            endDate={project.end_date}
                                        />
                                    </InfoSection>

                                    {/* Achievements */}
                                    <InfoSection title="Logros del Proyecto">
                                        <AchievementsList
                                            accomplishments={project.accomplishments}
                                            onToggle={canEdit ? (index, checked) => {
                                                const acc = Array.isArray(project.accomplishments)
                                                    ? project.accomplishments
                                                    : [];
                                                const updated = acc.map((x: any, j: number) =>
                                                    j === index ? { ...x, completed: checked } : x
                                                );
                                                onPatchAccomplishments(
                                                    updated.map((x: any) => ({
                                                        text: x.text,
                                                        completed: x.completed,
                                                    }))
                                                );
                                            } : undefined}
                                            disabled={accomplishmentsPatching || !canEdit}
                                        />
                                    </InfoSection>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Nombre del Proyecto *</Label>
                                            <Input
                                                value={infoForm.name}
                                                onChange={(e) => setInfoForm((p) => ({ ...p, name: e.target.value }))}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label>Categoría *</Label>
                                            <Select
                                                value={infoForm.project_category}
                                                onValueChange={(v) => setInfoForm((p) => ({ ...p, project_category: v }))}
                                            >
                                                <SelectTrigger className="mt-1">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PROJECT">Proyecto</SelectItem>
                                                    <SelectItem value="AGREEMENT">Convenio</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {isSupervisor && (
                                        <div>
                                            <Label>Agentes asignados</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="mt-1 w-full justify-between font-normal hover:bg-transparent hover:text-primary hover:border-current"
                                                        disabled={assigningAgent}
                                                    >
                                                        <span className="truncate min-w-0">
                                                            {(() => {
                                                                const assigned = Array.isArray(project?.assigned_agents) ? project.assigned_agents : [];
                                                                if (assigned.length === 0) return "Sin asignar";
                                                                return assigned.map((a: any) => a.name).join(", ");
                                                            })()}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[300px] p-0" align="start">
                                                    <div className="max-h-[250px] overflow-y-auto p-1">
                                                        {agents.map((a: any) => {
                                                            const currentIds = Array.isArray(project?.assigned_agents) ? project.assigned_agents.map((x: any) => x.id) : [];
                                                            const isSelected = currentIds.includes(a.id);
                                                            return (
                                                                <button
                                                                    key={a.id}
                                                                    type="button"
                                                                    className="flex items-center gap-2 w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                                    onClick={() => {
                                                                        const newIds = isSelected
                                                                            ? currentIds.filter((id: string) => id !== a.id)
                                                                            : [...currentIds, a.id];
                                                                        onAssignAgents(newIds);
                                                                    }}
                                                                >
                                                                    <div className={cn(
                                                                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                                                                    )}>
                                                                        {isSelected && <Check className="h-3 w-3" />}
                                                                    </div>
                                                                    {a.name}
                                                                </button>
                                                            );
                                                        })}
                                                        {agents.length === 0 && (
                                                            <p className="text-sm text-muted-foreground p-2">No hay agentes disponibles</p>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    )}
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
                                    <div>
                                        <Label>Logros del Proyecto</Label>
                                        <div className="mt-2 space-y-2">
                                            {infoForm.accomplishments.map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="flex gap-2 items-center"
                                                >
                                                    <Checkbox
                                                        checked={item.completed}
                                                        onCheckedChange={(checked) =>
                                                            setInfoForm((p) => ({
                                                                ...p,
                                                                accomplishments: p.accomplishments.map((a, j) =>
                                                                    j === i ? { ...a, completed: !!checked } : a
                                                                ),
                                                            }))
                                                        }
                                                        disabled={infoSaving}
                                                    />
                                                    <Input
                                                        value={item.text}
                                                        onChange={(e) =>
                                                            setInfoForm((p) => ({
                                                                ...p,
                                                                accomplishments: p.accomplishments.map((a, j) =>
                                                                    j === i ? { ...a, text: e.target.value } : a
                                                                ),
                                                            }))
                                                        }
                                                        placeholder="Texto del logro"
                                                        className="flex-1"
                                                        disabled={infoSaving}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive shrink-0"
                                                        onClick={() =>
                                                            setInfoForm((p) => ({
                                                                ...p,
                                                                accomplishments: p.accomplishments.filter(
                                                                    (_, j) => j !== i
                                                                ),
                                                            }))
                                                        }
                                                        disabled={infoSaving}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setInfoForm((p) => ({
                                                        ...p,
                                                        accomplishments: [
                                                            ...p.accomplishments,
                                                            { text: "", completed: false },
                                                        ],
                                                    }))
                                                }
                                                disabled={infoSaving}
                                            >
                                                <PlusCircle className="h-4 w-4 mr-2" />
                                                Agregar logro
                                            </Button>
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
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadExcelTemplate("financing-sources")}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar Formato
                                </Button>
                                {canEdit && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={excelImporting}
                                            onClick={() => {
                                                const input = document.createElement("input");
                                                input.type = "file";
                                                input.accept = ".xlsx";
                                                input.onchange = (e: any) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) importExcelFile(file, "financing-sources");
                                                };
                                                input.click();
                                            }}
                                        >
                                            {excelImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                            Importar Excel
                                        </Button>
                                        <Button size="sm" onClick={() => setAddSourceOpen(true)} color="success">
                                            <PlusCircle className="h-4 w-4 mr-2" />
                                            Agregar Fuente
                                        </Button>
                                    </>
                                )}
                            </div>
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
                                            <TableHead>Descripción</TableHead>
                                            <TableHead>Monto</TableHead>
                                            {canEdit && <TableHead>Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {financingSources.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell>{r.financing_source_name ?? "-"}</TableCell>
                                                <TableCell>{r.description || "-"}</TableCell>
                                                <TableCell>{formatCurrency(Number(r.amount ?? 0))}</TableCell>
                                                {canEdit && (
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
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                    </TabsContent>

                    <TabsContent value="donaciones" className="mt-0 px-6 pt-6 pb-6">
                        <div className="flex flex-row items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Donaciones Recibidas</h3>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadExcelTemplate("donations")}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar Formato
                                </Button>
                                {canEdit && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={excelImporting}
                                            onClick={() => {
                                                const input = document.createElement("input");
                                                input.type = "file";
                                                input.accept = ".xlsx";
                                                input.onchange = (e: any) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) importExcelFile(file, "donations");
                                                };
                                                input.click();
                                            }}
                                        >
                                            {excelImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                            Importar Excel
                                        </Button>
                                        <Button size="sm" onClick={() => setAddDonationOpen(true)} color="success">
                                            <PlusCircle className="h-4 w-4 mr-2" />
                                            Agregar Donación
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 mb-4">
                            <div className="border border-border rounded-md px-3 py-2">
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
                                <p className="text-sm font-semibold text-foreground mt-0.5">{formatCurrency(totalDonaciones)}</p>
                            </div>
                            <div className="border border-border rounded-md px-3 py-2">
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Efectivo</span>
                                <p className="text-sm font-semibold text-foreground mt-0.5">{formatCurrency(cashDonations)}</p>
                            </div>
                            <div className="border border-border rounded-md px-3 py-2">
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Especie</span>
                                <p className="text-sm font-semibold text-foreground mt-0.5">{formatCurrency(inKindDonations)}</p>
                            </div>
                            <div className="border border-border rounded-md px-3 py-2">
                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Beneficio</span>
                                <p className="text-sm font-semibold text-foreground mt-0.5">{formatCurrency(benefitDonations)}</p>
                            </div>
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
                                            {canEdit && <TableHead>Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {donations.map((r) => (
                                            <TableRow key={r.id}>
                                                <TableCell>{r.description || "-"}</TableCell>
                                                <TableCell>{r.donation_type === "CASH" ? "Efectivo" : r.donation_type === "BENEFIT" ? "Beneficio" : "Suministros"}</TableCell>
                                                <TableCell>{formatCurrency(Number(r.amount ?? 0))}</TableCell>
                                                <TableCell>
                                                    {r.created_dt ? dateToString(new Date(r.created_dt)) : "-"}
                                                </TableCell>
                                                {canEdit && (
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
                                                )}
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
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadExcelTemplate("expenses")}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar Formato
                                </Button>
                                {canEdit && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={excelImporting}
                                            onClick={() => {
                                                const input = document.createElement("input");
                                                input.type = "file";
                                                input.accept = ".xlsx";
                                                input.onchange = (e: any) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) importExcelFile(file, "expenses");
                                                };
                                                input.click();
                                            }}
                                        >
                                            {excelImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                            Importar Excel
                                        </Button>
                                        <Button size="sm" onClick={() => setAddExpenseOpen(true)} color="success">
                                            <PlusCircle className="h-4 w-4 mr-2" />
                                            Agregar Gasto
                                        </Button>
                                    </>
                                )}
                            </div>
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
                                            <TableHead>Categoría</TableHead>
                                            <TableHead>Monto</TableHead>
                                            {canEdit && <TableHead>Acciones</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expenses.map((r) => {
                                            const cat = expenseCategories.find((c) => c.id === r.expense_category_id);
                                            return (
                                                <TableRow key={r.id}>
                                                    <TableCell>{r.description || "-"}</TableCell>
                                                    <TableCell>{cat?.name ?? "-"}</TableCell>
                                                    <TableCell>{formatCurrency(Number(r.amount ?? 0))}</TableCell>
                                                    {canEdit && (
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
                                                    )}
                                                </TableRow>
                                            );
                                        })}
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
                            {canEdit && (
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
                            )}
                            {files.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Archivos subidos ({files.length})</Label>
                                    {files.map((f) => {
                                        const name = typeof f.file === "string" ? f.file.split(/[/\\]/).pop() : f.description || "archivo";
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
                                                    {canEdit && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive"
                                                            onClick={() => deleteFile(f.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="bitacora" className="mt-0 px-6 pt-6 pb-6">
                        <h3 className="text-lg font-semibold mb-4">Bitácora del Proyecto</h3>
                        {logsLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : projectLogs.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No hay registros en la bitácora.</p>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Usuario</TableHead>
                                            <TableHead>Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {projectLogs.map((l: any) => (
                                            <TableRow key={l.id}>
                                                <TableCell className="whitespace-nowrap">{dateToString(new Date(l.created_dt))}</TableCell>
                                                <TableCell>{l.user_name ?? "-"}</TableCell>
                                                <TableCell>{l.log}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="flex justify-between items-center mt-4 text-sm">
                                    <span className="text-muted-foreground">{logsCount} registro(s)</span>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={logsOffset === 0}
                                            onClick={() => { const n = logsOffset - 1; setLogsOffset(n); fetchProjectLogs(n * logsLimit); }}
                                        >
                                            Anterior
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={(logsOffset + 1) * logsLimit >= logsCount}
                                            onClick={() => { const n = logsOffset + 1; setLogsOffset(n); fetchProjectLogs(n * logsLimit); }}
                                        >
                                            Siguiente
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
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

            <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{isArchived ? "Desarchivar proyecto" : "Archivar proyecto"}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {isArchived
                                ? "¿Desarchivar este proyecto? Volverá a aparecer en la lista de proyectos activos."
                                : "¿Archivar este proyecto? Podrás verlo filtrando por Archivados en la lista de proyectos."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={onArchiveProject}>
                            {archiving
                                ? (isArchived ? "Desarchivando..." : "Archivando...")
                                : (isArchived ? "Desarchivar" : "Archivar")}
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
                                        <SelectItem value="BENEFIT">Beneficio</SelectItem>
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
                                <Label>Categoría (opcional)</Label>
                                <Select
                                    value={addExpenseForm.expense_category_id}
                                    onValueChange={(v) => setAddExpenseForm((p) => ({ ...p, expense_category_id: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sin categoría" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {expenseCategories.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Nueva categoría..."
                                        className="flex-1"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onCreateCategory}
                                        disabled={creatingCategory || !newCategoryName.trim()}
                                    >
                                        {creatingCategory ? "..." : "Crear"}
                                    </Button>
                                </div>
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
