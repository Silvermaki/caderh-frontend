"use client"
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import LogInForm from "./login-form";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";

const LoginPage = () => {

    const { setTheme } = useTheme();
    const { data: session, status, } = useSession();
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

    useEffect(() => {
        setTheme("light");
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            console.log(JSON.stringify(session));
            window.location.assign("/dashboard/home");
        }
    }, [status])

    if (status !== "unauthenticated" && !isLoggingIn) {
        return <div className="h-screen w-full flex flex-row items-center justify-center">
            <Loader2 color="#38af68" className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
        </div>
    }

    return (
        <div className="loginwrapper bg-background flex items-center min-h-screen overflow-hidden w-full">
            <div className="lg-inner-column grid  lg:grid-cols-2 w-full flex-wrap justify-center p-4 overflow-y-auto">
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
                        <LogInForm setIsLoggingIn={setIsLoggingIn} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
