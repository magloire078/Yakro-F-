

import { UserAuthForm } from "@/components/user-auth-form";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    return (
        <div className="flex h-full items-center justify-center">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
                <Card className="p-6">
                    <CardHeader className="text-center">
                        <Icons.logo className="mx-auto h-12 w-12 text-primary" />
                        <CardTitle className="text-2xl">Bienvenue</CardTitle>
                        <CardDescription>
                            Entrez votre e-mail pour vous connecter ou créer un compte
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UserAuthForm />
                    </CardContent>
                </Card>
                 <p className="px-8 text-center text-sm text-muted-foreground">
                    En cliquant sur continuer, vous acceptez nos{" "}
                    <a
                        href="/terms"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Conditions d'utilisation
                    </a>{" "}
                    et notre{" "}
                    <a
                        href="/privacy"
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        Politique de confidentialité
                    </a>
                    .
                </p>
            </div>
        </div>
    );
}
