/**
 *  GoogleDriveAutoLogin.tsx
 *
 *  @copyright 2026 Digital Aid Seattle
 *
 */

import { ReactNode, useEffect } from "react";
import { GoogleDriveService } from "../services/googleDriveService";
import { useAuthService } from "@digitalaidseattle/core";

export const GoogleDriveAutoLogin = ({ children }: { children: ReactNode }) => {
    const authService = useAuthService();
    const service = GoogleDriveService.getInstance();

    useEffect(() => {
        if (authService && service) {
            authService.hasUser()
                .then(hasUser => {
                    if (hasUser) {
                        service.checkToken();
                    }
                })
        }
    }, [authService, service])

    return (
        <>
            {children}
        </>
    )
}

