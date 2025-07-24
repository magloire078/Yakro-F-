
import { UserAuthForm } from "@/components/user-auth-form";
import { Icons } from "@/components/icons";

export default function LoginPage() {
    return (
        <div className="container relative flex h-full flex-col items-center justify-center">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <Icons.logo className="mx-auto h-12 w-12 text-primary" />
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Bienvenue
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Entrez votre e-mail pour vous connecter ou créer un compte
                    </p>
                </div>
                <UserAuthForm />
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
