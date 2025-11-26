"use client"
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import RecoverForm from "./recover-form";
import VerifyForm from "./verify-form";
import VerifyPassword from "./verify-password";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import caderhLogo from "@/public/images/logo/caderh-logo.jpg";

const LoginPage = () => {

    const { setTheme } = useTheme();
    const { data: session, status } = useSession();
    const [recoveryEmail, setRecoveryEmail] = useState('');
    const [view, setView] = useState(1);
    const [recoveryId, setRecoveryId] = useState('');

    useEffect(() => {
        setTheme("light");
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            window.location.assign("/dashboard/home");
        }
    }, [status])

    if (status !== "unauthenticated") {
        return <div className="h-screen w-full flex flex-row items-center justify-center">
            <Loader2 color="#38af68" className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
        </div>
    }

    return (
        <div className="loginwrapper bg-background flex items-center min-h-screen overflow-hidden  w-full">
            <div className="lg-inner-column  grid  lg:grid-cols-2 w-full flex-wrap justify-center  p-4 overflow-y-auto">
                <div className={`h-full w-full bg-[url('../../../public/images/auth/login-bg.jpg')] bg-center hidden lg:block rounded-xl`}>
                    <div className="flex flex-row items-center justify-center h-full">
                        <div className="flex-none">
                            <div className="flex flex-row items-center justify-center">

                            </div>
                        </div>
                    </div>
                </div>
                <div className=" px-4  py-5 flex justify-center items-center">
                    <div className="lg:w-[480px]">
                        {view === 1 && <RecoverForm setView={setView} setRecoveryEmail={setRecoveryEmail} />}
                        {view === 2 && <VerifyForm setView={setView} recoveryEmail={recoveryEmail} setRecoveryId={setRecoveryId} />}
                        {view === 3 && <VerifyPassword setView={setView} recoveryId={recoveryId} />}
                        {view === 4 && <>
                            <Link href="/" className="inline-block w-full">
                                <Image src={caderhLogo} alt="CADERH" className="h-24 w-auto mx-auto" priority={true} />
                            </Link>
                            <div className="2xl:mt-4 mt-6 2xl:text-3xl text-2xl font-bold text-secondary-foreground text-center">
                                Recuperar Contraseña
                            </div>
                            <Alert color="success" variant="soft" className="mb-4 mt-8">
                                <AlertDescription className="text-center">
                                    Contraseña recuperada exitosamente
                                </AlertDescription>
                            </Alert>
                            <div className="mt-5 2xl:mt-8 text-center text-sm text-default-600">
                                Regresar a{" "}
                                <Link href="/" className="text-primary">
                                    Conectarme
                                </Link>
                            </div>
                        </>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
