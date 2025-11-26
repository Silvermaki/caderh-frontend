"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { ChangeEvent, KeyboardEvent, useRef, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Loader2 } from "lucide-react";
import caderhLogo from "@/public/images/logo/caderh-logo.jpg";
import toast from "react-hot-toast";

const VerfiyForm = ({ setView, recoveryEmail, setRecoveryId }: any) => {
    const totalOtpField = 6;
    const otpFields = Array.from({ length: totalOtpField }, (_, index) => index);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [isPending, startTransition] = useTransition();
    const isDesktop2xl = useMediaQuery("(max-width: 1530px)");
    const otpArray: string[] = Array.from({ length: totalOtpField }, () => "");
    const [otp, setOtp] = useState<string[]>(otpArray);

    const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
        const { value } = e.target;
        if (!isNaN(Number(value)) && (index === 0 ? value.length <= totalOtpField : value.length <= 1)) {
            if (index === 0) {
                const newOtp = [...otp];
                for (let i = 0; i < value.length; i++) {
                    newOtp[i] = value[i];
                }
                setOtp(newOtp);
                if (value.length === totalOtpField) {
                    inputRefs.current[0]?.blur();
                } else {
                    inputRefs.current[value.length]?.focus();
                }
            } else {
                const newOtp = [...otp];
                newOtp[index] = value;
                setOtp(newOtp);
                if (index === totalOtpField - 1) {
                    if (value.length === 1) {
                        inputRefs.current[totalOtpField - 1]?.blur();
                    }
                } else {
                    if (value.length === 1 && index < totalOtpField - 1) {
                        inputRefs.current[index + 1]?.focus();
                    }
                }

            }
        }
    };

    const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace" && otp[index] === "" && index > 0) {
            setOtp((prevOtp: any) => {
                const newOtp = [...prevOtp];
                newOtp[index - 1] = "";
                return newOtp;
            });
            inputRefs.current[index - 1]?.focus();
        } else if (event.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (event.key === "ArrowRight" && index < totalOtpField - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const isOtpComplete = otp.every((digit: any) => digit !== "");

    const onCode = async (data: any) => {
        const enteredOtp = otp.join("");
        startTransition(async () => {
            const auth = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/recover_verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: recoveryEmail,
                    code: enteredOtp
                })
            });
            if (auth.status === 200) {
                let response = await auth.json();
                console.log(response);
                setRecoveryId(response.id);
                setView(3);
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
            <div className="2xl:text-lg text-base text-default-600 mt-2 leading-6 text-center">
                Ingrese el código de verificación
            </div>
            <form className="mt-8">
                <div className="flex flex-wrap  gap-1 lg:gap-6">
                    {otpFields.map((index) => (
                        <Input
                            key={`otp-code-${index}`}
                            type="text"
                            id={`otp${index}`}
                            name={`otp${index}`}
                            value={otp[index]}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(event) => handleKeyDown(index, event)}
                            maxLength={index === 0 ? 6 : 1}
                            className="w-10 h-10 sm:w-[60px] sm:h-14 rounded border-default-300 text-center text-2xl font-medium text-default-900"
                            ref={(ref) => (inputRefs.current[index] = ref) as any}
                        />
                    ))}
                </div>
            </form>
            <div className="mt-4 xl:mt-4">
                <Button
                    onClick={onCode}
                    className="w-full mt-8"
                    disabled={isPending || !isOtpComplete}
                    size={!isDesktop2xl ? "lg" : "md"}
                >
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isPending ? "cargando..." : "Confirmar"}
                </Button>
            </div>
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
