"use client";

import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import axios from "axios";
import { Loader2 } from "lucide-react";

const userFormSchema = z.object({
  name: z.string().min(1, { message: "O nome é obrigatório" }),
  email: z.string().email({ message: "O email é inválido" }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),
  newPassword: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),
  confirmNewPassword: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  path: ["confirmNewPassword"],
  message: "As senhas não coincidem",
});

export default function Settings() {
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true);

  const userForm = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await axios.get('/api/auth/me');
        userForm.setValue('name', data.userName);
        userForm.setValue('email', data.userEmail);
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        toast.error('Não foi possível carregar os dados do usuário');
      } finally {
        setIsFetchingUser(false);
      }
    };

    fetchUserData();
  }, [userForm]);

  const onSubmitUserForm = async (data: z.infer<typeof userFormSchema>) => {
    setIsLoadingUser(true);
    try {
      await axios.put('/api/users/update', data);
      toast.success('Informações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
      toast.error('Não foi possível atualizar as informações');
    } finally {
      setIsLoadingUser(false);
    }
  };

  const onSubmitPasswordForm = async (data: z.infer<typeof passwordFormSchema>) => {
    setIsLoadingPassword(true);
    try {
      await axios.put('/api/users/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Senha alterada com sucesso!');
      passwordForm.reset();
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('Senha atual incorreta');
      } else {
        console.error('Erro ao alterar senha:', error);
        toast.error('Não foi possível alterar a senha');
      }
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="w-full flex flex-col md:flex-row items-center justify-between">
        <Label className="text-xl font-bold">Configurações</Label>
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="w-full h-max">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetchingUser ? (
              <div className="w-full h-36 flex items-center justify-center">
                <Loader2 className="size-6 text-primary animate-spin" />
              </div>
            ) : (
              <Form {...userForm}>
                <form onSubmit={userForm.handleSubmit(onSubmitUserForm)} className="space-y-4">
                  <FormField
                    control={userForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoadingUser} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={userForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isLoadingUser} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoadingUser} className="w-full">
                    {isLoadingUser ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                    Salvar Alterações
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
        <Card className="w-full h-max">
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onSubmitPasswordForm)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha Atual</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} disabled={isLoadingPassword} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} disabled={isLoadingPassword} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} disabled={isLoadingPassword} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoadingPassword} className="w-full">
                  {isLoadingPassword ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Alterar Senha
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
