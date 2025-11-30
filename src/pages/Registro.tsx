import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import marjocLogo from "@/assets/marjoc-logo.jpg";

const Registro = () => {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<'administrador' | 'farmaceutico' | 'operador_caixa'>('farmaceutico');
  const [loading, setLoading] = useState(false);
  const [isFirst, setIsFirst] = useState(false);
  const { user, isAdmin, signUp, createUser, isFirstUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkFirstUser = async () => {
      const first = await isFirstUser();
      setIsFirst(first);
      
      // Se não é o primeiro usuário e não está logado como admin, redireciona
      if (!first && !user) {
        navigate("/login");
      }
    };
    
    checkFirstUser();
  }, [user, isFirstUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isFirst) {
        // Primeiro usuário - registro normal
        await signUp(username, password, nomeCompleto);
        toast({
          title: "Conta de Administrador criada com sucesso!",
          description: "Bem-vindo ao sistema Marjoc",
        });
      } else if (isAdmin) {
        // Admin criando novo usuário
        await createUser(username, password, nomeCompleto, role);
        toast({
          title: "Usuário criado com sucesso!",
          description: `Novo ${role} adicionado ao sistema`,
        });
        // Limpar formulário
        setNomeCompleto("");
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setRole('farmaceutico');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar permissões
  if (!isFirst && !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h1>
            <p className="text-muted-foreground mb-6">
              Apenas administradores podem criar novos usuários.
            </p>
            <Link to="/">
              <Button>Voltar ao Início</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center gap-4">
          <img src={marjocLogo} alt="Marjoc Logo" className="h-20 w-20 rounded-full object-cover" />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">
              {isFirst ? "Criar Conta de Administrador" : "Criar Novo Usuário"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isFirst ? : "Sistema de Gestão Farmacêutica"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nomeCompleto">Nome Completo</Label>
            <Input
              id="nomeCompleto"
              type="text"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              required
              placeholder="Digite seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Escolha um username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Escolha uma senha"
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirme sua senha"
              minLength={6}
            />
          </div>

          {!isFirst && isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="role">Perfil do Usuário</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="farmaceutico">Farmacêutico</SelectItem>
                  <SelectItem value="operador_caixa">Operador de Caixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando conta..." : isFirst ? "Criar Conta de Administrador" : "Criar Usuário"}
          </Button>

          {isFirst && (
            <p className="text-center text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Fazer login
              </Link>
            </p>
          )}
          
          {!isFirst && isAdmin && (
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/" className="text-primary hover:underline">
                Voltar ao Dashboard
              </Link>
            </p>
          )}
        </form>
      </Card>
    </div>
  );
};

export default Registro;
