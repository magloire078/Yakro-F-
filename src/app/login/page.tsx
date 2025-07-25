
'use client';

import * as React from 'react';
import { UserAuthForm } from "@/components/user-auth-form";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
    return (
        <div className="flex h-full items-center justify-center">
            <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
                <Tabs defaultValue="login" className="w-full">
                    <Card className="p-6">
                        <CardHeader className="text-center">
                            <Icons.logo className="mx-auto h-12 w-12 text-primary" />
                            <TabsList className="grid w-full grid-cols-2 mt-4">
                                <TabsTrigger value="login">Se connecter</TabsTrigger>
                                <TabsTrigger value="signup">S'inscrire</TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <TabsContent value="login">
                                <CardDescription className="text-center mb-4">
                                    Entrez vos identifiants pour accéder à votre compte.
                                </CardDescription>
                                <UserAuthForm mode="login" />
                            </TabsContent>
                            <TabsContent value="signup">
                                 <CardDescription className="text-center mb-4">
                                    Créez un nouveau compte pour commencer.
                                </CardDescription>
                                <UserAuthForm mode="signup" />
                            </TabsContent>
                        </CardContent>
                    </Card>
                </Tabs>
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
