"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { ChangeEvent, KeyboardEvent, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Icon } from "@iconify/react";
import { Loader2 } from "lucide-react";
import caderhLogo from "@/public/images/logo/caderh-logo.jpg";
import toast from "react-hot-toast";

const VerfiyForm = ({ setView, recoveryId }: any) => {
    const [isPending, startTransition] = useTransition();
    const [passwordType, setPasswordType] = useState<string>("password");
    const isDesktop2xl = useMediaQuery("(max-width: 1530px)");

    const togglePasswordType = () => {
        if (passwordType === "text") {
            setPasswordType("password");
        } else if (passwordType === "password") {
            setPasswordType("text");
        }
    };

    const newPassSchema = z.object({
        newPassword: z.string().min(8, { message: "Password must have at least 8 characters" }),
        confirmNewPassword: z.string().min(1, { message: "" })
    }).superRefine(({ newPassword, confirmNewPassword }, checkPassComplexity) => {
        const isValid = /(?=.*[a-z])(?=.*[A-Z])/.test(newPassword);
        if (!isValid) {
            checkPassComplexity.addIssue({
                code: "custom",
                path: ["newPassword"],
                message: "Password must have at least one uppercase and lowercase letter",
            });
        } else {
            if (newPassword !== confirmNewPassword) {
                checkPassComplexity.addIssue({
                    code: "custom",
                    path: ["confirmNewPassword"],
                    message: "Passwords must match",
                });
            }
        }
    });

    const {
        register: newPassRegister,
        handleSubmit: newPassHandleSubmit,
        reset: newPassReset,
        formState: { errors: newPassErrors, dirtyFields: newPassIsDirty },
    } = useForm({
        resolver: zodResolver(newPassSchema),
        mode: "onSubmit",
        defaultValues: {
            newPassword: "",
            confirmNewPassword: "",
        },
    });

    const onNewPass = async (data: any) => {
        setPasswordType("password");
        startTransition(async () => {
            const auth = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/recover_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: data.newPassword,
                    id: recoveryId
                })
            });
            if (auth.status === 200) {
                setView(4);
                newPassReset();
            } else {
                let response = await auth.json();
                toast.error(response.message);
            }
        });
    };

    return (
        <div className="w-full md:w-[480px] py-5">
            <Link href="/" className="inline-block w-full">
                <Image src={caderhLogo} alt="CADERH" className="h-24 w-auto mx-auto" priority={true} />
            </Link>
            <div className="2xl:mt-4 mt-6 2xl:text-3xl text-2xl font-bold text-secondary-foreground text-center">
                Recuperar Contraseña
            </div>
            <form onSubmit={newPassHandleSubmit(onNewPass)} className="mt-10 xl:mt-10" noValidate>
                <div className="relative mt-4">
                    <Label
                        htmlFor="newPassword"
                        className="mb-2 font-medium text-default-600"
                    >
                        Nueva Contraseña
                    </Label>
                    <div className="relative">
                        <Input
                            disabled={isPending}
                            {...newPassRegister("newPassword")}
                            type={passwordType}
                            id="newPassword"
                            className="peer "
                            size={!isDesktop2xl ? "xl" : "lg"}
                            placeholder=" "
                        />

                        <div
                            className="absolute top-1/2 -translate-y-1/2 ltr:right-4 rtl:left-4 cursor-pointer"
                            onClick={togglePasswordType}
                        >
                            {passwordType === "password" ? (
                                <Icon
                                    icon="heroicons:eye"
                                    className="w-5 h-5 text-default-400"
                                />
                            ) : (
                                <Icon
                                    icon="heroicons:eye-slash"
                                    className="w-5 h-5 text-default-400"
                                />
                            )}
                        </div>
                    </div>
                </div>
                {newPassErrors.newPassword && (
                    <div className=" text-destructive mt-2">
                        {newPassErrors.newPassword.message}
                    </div>
                )}

                <div className="mt-3.5">
                    <Label
                        htmlFor="confirmNewPassword"
                        className="mb-2 font-medium text-default-600"
                    >
                        Confirmar Nueva Contraseña
                    </Label>
                    <div className="relative">
                        <Input
                            disabled={isPending}
                            {...newPassRegister("confirmNewPassword")}
                            type={passwordType}
                            id="confirmNewPassword"
                            className="peer "
                            size={!isDesktop2xl ? "xl" : "lg"}
                            placeholder=" "
                        />
                    </div>
                </div>
                {newPassErrors.confirmNewPassword && (
                    <div className=" text-destructive mt-2">
                        {newPassErrors.confirmNewPassword.message}
                    </div>
                )}
                <Button
                    className="w-full mt-8"
                    disabled={isPending || !newPassIsDirty.newPassword || !newPassIsDirty.confirmNewPassword}
                    size={!isDesktop2xl ? "lg" : "md"}
                >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? "cargando..." : "Confirmar"}
                </Button>
            </form>
            <div className="mt-5 2xl:mt-8 text-center text-sm text-default-600">
                Regresar a{" "}
                <Link href="/" className="text-primary">
                    Conectarme
                </Link>
            </div>
        </div>
    );
};

export default VerfiyForm;
