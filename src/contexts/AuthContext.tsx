import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type UserRole = 'administrador' | 'farmaceutico' | 'operador_caixa' | null;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: UserRole;
  isAdmin: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, nomeCompleto: string) => Promise<void>;
  createUser: (username: string, password: string, nomeCompleto: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  isFirstUser: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isAdmin = userRole === 'administrador';

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    setUserRole(data?.role || null);
  };

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => {
          fetchUserRole(session.user.id);
        }, 0);
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (username: string, password: string) => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (!profiles) {
      throw new Error("Usuário não encontrado");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: `${username}@marjoc.local`,
      password,
    });

    if (error) throw error;
    navigate("/");
  };

  const signUp = async (username: string, password: string, nomeCompleto: string) => {
    const { error } = await supabase.auth.signUp({
      email: `${username}@marjoc.local`,
      password,
      options: {
        data: {
          username,
          nome_completo: nomeCompleto,
        },
      },
    });

    if (error) throw error;
    navigate("/");
  };

  const createUser = async (username: string, password: string, nomeCompleto: string, role: UserRole) => {
    if (!isAdmin) {
      throw new Error("Apenas administradores podem criar usuários");
    }

    // Criar usuário
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: `${username}@marjoc.local`,
      password,
      options: {
        data: {
          username,
          nome_completo: nomeCompleto,
        },
      },
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error("Erro ao criar usuário");

    // Atribuir papel
    if (role) {
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: role,
        });

      if (roleError) throw roleError;
    }
  };

  const isFirstUser = async () => {
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });
    
    return count === 0;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, userRole, isAdmin, signIn, signUp, createUser, signOut, isFirstUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
