"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "@/hooks/use-media-query";
import Image from "next/image";
import caderhLogo from "@/public/images/logo/caderh-logo.jpg";
const emailSchema = z.object({
    email: z.string().email({ message: "Your email is invalid." }),
});
const ForgotForm = ({ setView, setRecoveryEmail }: any) => {
    const [isPending, startTransition] = React.useTransition();
    const isDesktop2xl = useMediaQuery("(max-width: 1530px)");
    const router = useRouter();
    const {
        register: emailRegister,
        handleSubmit: emailHandleSubmit,
        reset: emailReset,
        formState: { errors: emailErrors },
    } = useForm({
        resolver: zodResolver(emailSchema),
        mode: "all",
    });
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => setIsVisible(!isVisible);

    const onEmailSubmit = (data: any) => {
        startTransition(async () => {
            const auth = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/recover`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: data.email
                })
            });
            if (auth.status === 200) {
                setRecoveryEmail(data.email)
                setView(2);
                toast.success("El código de recuperación ha sido enviado a tu correo electrónico");
                emailReset();
            } else {
                let response = await auth.json();
                toast.error(response.message);
            }
        });
    };

    return (
        <div className="w-full">
            <Link href="/" className="inline-block w-full">
                <Image src={caderhLogo} alt="CADERH" className="h-24 w-auto mx-auto" priority={true} />
            </Link>
            <div className="2xl:mt-4 mt-6 2xl:text-3xl text-2xl font-bold text-secondary-foreground text-center">
                Recuperar Contraseña
            </div>
            <div className="2xl:text-lg text-base text-default-600 mt-2 leading-6 text-center">
                Ingrese su correo electrónico para recuperar su contraseña
            </div>
            <form onSubmit={emailHandleSubmit(onEmailSubmit)} className="mt-5 xl:mt-7">
                <div>
                    <Input
                        disabled={isPending}
                        {...emailRegister("email")}
                        type="email"
                        id="email"
                        className={cn("", {
                            "border-destructive": emailErrors.email,
                        })}
                        size={!isDesktop2xl ? "xl" : "lg"}
                    />
                    {emailErrors.email && (
                        <div className=" text-destructive mt-2">{emailErrors.email.message as string}</div>
                    )}
                </div>

                <Button className="w-full mt-6" size={!isDesktop2xl ? "lg" : "md"}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? "enviando..." : "Enviar Código de Recuperación"}
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

export default ForgotForm;
