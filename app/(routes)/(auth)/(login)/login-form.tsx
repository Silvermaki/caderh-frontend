"use client";
import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import caderhLogo from "@/public/images/logo/caderh-logo.jpg";
import { Alert, AlertDescription } from "@/components/ui/alert";

const loginSchema = z.object({
    email: z.string().email({ message: "Correo electrónico no válido" }),
    password: z.string().min(4, { message: "" })
});

const newPassSchema = z.object({
    newPassword: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
    confirmNewPassword: z.string().min(1, { message: "" })
}).superRefine(({ newPassword, confirmNewPassword }, checkPassComplexity) => {
    const isValid = /(?=.*[a-z])(?=.*[A-Z])/.test(newPassword);
    if (!isValid) {
        checkPassComplexity.addIssue({
            code: "custom",
            path: ["newPassword"],
            message: "La contraseña debe tener al menos una letra mayúscula y una letra minúscula",
        });
    } else {
        if (newPassword !== confirmNewPassword) {
            checkPassComplexity.addIssue({
                code: "custom",
                path: ["confirmNewPassword"],
                message: "Las contraseñas no coinciden",
            });
        }
    }
});

const LogInForm = ({ setIsLoggingIn }: { setIsLoggingIn: any }) => {
    const isDesktop2xl = useMediaQuery("(max-width: 1530px)");
    const [isPending, startTransition] = useTransition();
    const [passwordType, setPasswordType] = useState<string>("password");
    const [view, setView] = useState<number>(1);
    const [passwordChallengeData, setPasswordChallengeData] = useState({
        id: "",
        session: "",
        email: "",
        name: "",
        role: "",
        challenge: "",
    });

    const togglePasswordType = () => {
        if (passwordType === "text") {
            setPasswordType("password");
        } else if (passwordType === "password") {
            setPasswordType("text");
        }
    };

    const {
        register: loginRegister,
        handleSubmit: loginHandleSubmit,
        reset: loginReset,
        formState: { errors: loginErrors },
    } = useForm({
        resolver: zodResolver(loginSchema),
        mode: "onSubmit",
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const {
        register: newPassRegister,
        handleSubmit: newPassHandleSubmit,
        reset: newPassReset,
        formState: { errors: newPassErrors },
    } = useForm({
        resolver: zodResolver(newPassSchema),
        mode: "onSubmit",
        defaultValues: {
            newPassword: "",
            confirmNewPassword: "",
        },
    });

    const onLogin = async (data: any) => {
        setIsLoggingIn(true);
        setPasswordType("password");
        setView(1);
        startTransition(async () => {
            const response = await signIn('credentials', {
                username: data.email,
                password: data.password,
                redirect: false
            });
            if (response) {
                if (response.status === 200 && response.error) {
                    const challengeResponse = JSON.parse(response.error);
                    if (challengeResponse.challenge) {
                        setView(2);
                        loginReset();
                        setPasswordChallengeData(challengeResponse);
                    } else {
                        toast.error("Credenciales de acceso incorrectas");
                    }
                } else {
                    if (response.status === 200) {
                        window.location.assign("/dashboard/home");
                        loginReset();
                    } else {
                        toast.error("Credenciales de acceso incorrectas");
                    }
                }
            } else {
                toast.error("Credenciales de acceso incorrectas");
            }
            setIsLoggingIn(false);
        });
    };

    const onNewPass = async (data: any) => {
        setPasswordType("password");
        startTransition(async () => {
            const auth = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/new-pass`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${passwordChallengeData.session}`
                },
                body: JSON.stringify({
                    password: data.newPassword
                })
            });
            let response = await auth.json();
            if (auth.status === 200) {
                setPasswordChallengeData({
                    id: "",
                    session: "",
                    email: "",
                    name: "",
                    role: "",
                    challenge: "",
                });
                setView(3);
                newPassReset();
            } else {
                toast.error(response.message);
            }
        });
    };

    return (
        <div className="w-full py-5 bg-white">
            <Link href="/" className="inline-block w-full">
                <Image src={caderhLogo} alt="CADERH" className="h-24 w-auto mx-auto" priority={true} />
            </Link>
            <div className="2xl:mt-4 mt-6 2xl:text-3xl text-2xl font-bold text-secondary-foreground text-center mb-12">
                Sistema Estadístico de CADERH
            </div>
            {(view === 1 || view === 3) && (
                <form onSubmit={loginHandleSubmit(onLogin)} className="mt-4 xl:mt-7" noValidate>
                    {view === 3 && (
                        <Alert color="success" variant="soft" className="mb-4">
                            <AlertDescription className="text-center">
                                La contraseña se cambió exitosamente
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="relative">
                        <Label htmlFor="email" className="mb-2 font-medium text-default-600">
                            Correo Electrónico
                        </Label>
                        <Input
                            disabled={isPending}
                            {...loginRegister("email")}
                            type="email"
                            id="email"
                            className={cn("peer", {
                                "border-destructive": loginErrors.email,
                            })}
                            size={!isDesktop2xl ? "xl" : "lg"}
                            placeholder=""
                        />
                    </div>
                    {loginErrors.email && (
                        <div className=" text-destructive mt-2">{loginErrors.email.message}</div>
                    )}

                    <div className="mt-3.5">
                        <Label
                            htmlFor="password"
                            className="mb-2 font-medium text-default-600"
                        >
                            Contraseña
                        </Label>
                        <div className="relative">
                            <Input
                                disabled={isPending}
                                {...loginRegister("password")}
                                type={passwordType}
                                id="password"
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
                    {loginErrors.password && (
                        <div className=" text-destructive mt-2">
                            {loginErrors.password.message}
                        </div>
                    )}
                    <Button
                        className="w-full mt-10"
                        disabled={isPending}
                        size={!isDesktop2xl ? "lg" : "md"}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPending ? "Cargando..." : "Conectarse"}
                    </Button>
                    <div className="mt-5 flex flex-row flex-justify-center text-center ">
                        <Link href="/recover" className="flex-1 text-sm text-primary">
                            ¿Olvidó su contraseña?
                        </Link>
                    </div>
                </form>
            )}
            {view === 2 && (
                <form onSubmit={newPassHandleSubmit(onNewPass)} className="mt-4 xl:mt-7" noValidate>
                    <Alert color="info" variant="soft">
                        <AlertDescription className="text-center">
                            Se requiere cambio de contraseña
                        </AlertDescription>
                    </Alert>
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
                        disabled={isPending}
                        size={!isDesktop2xl ? "lg" : "md"}
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPending ? "Cargando..." : "Confirmar"}
                    </Button>
                </form>
            )}
        </div>
    );
};

export default LogInForm;
