import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type UserRole = 'administrador' | 'farmaceutico' | 'operador_caixa';

interface Profile {
  nome_completo: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  userRole: UserRole | null;
  isAdmin: boolean;
  hasAnyUsers: boolean | null;
  signUp: (nomeCompleto: string, username: string, password: string) => Promise<{ error: any }>;
  signIn: (username: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkHasUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [hasAnyUsers, setHasAnyUsers] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo, username')
        .eq('id', userId)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (roleData) {
        setUserRole(roleData.role as UserRole);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const checkHasUsers = async () => {
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      setHasAnyUsers((count ?? 0) > 0);
    } catch (error) {
      console.error('Error checking users:', error);
      setHasAnyUsers(true);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      
      setLoading(false);
    });

    // Check if there are any users
    checkHasUsers();

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (nomeCompleto: string, username: string, password: string) => {
    // Generate a unique email using username (Supabase requires email)
    const email = `${username}@marjoc.local`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo: nomeCompleto,
          username: username
        }
      }
    });
    
    if (!error) {
      await checkHasUsers();
    }
    
    return { error };
  };

  const signIn = async (username: string, password: string) => {
    // First get the email for this username
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();
    
    if (profileError || !profileData) {
      return { error: { message: "Username ou senha incorretos" } };
    }
    
    // Get the user's email from auth.users
    const { data: { user: authUser }, error: userError } = await supabase.auth.admin.getUserById(profileData.id);
    
    if (userError || !authUser) {
      // Fallback: try with username@marjoc.local format
      const email = `${username}@marjoc.local`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error) {
        navigate("/");
      }
      
      return { error: error || { message: "Username ou senha incorretos" } };
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email: authUser.email!,
      password,
    });
    
    if (!error) {
      navigate("/");
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const isAdmin = userRole === 'administrador';

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      profile, 
      userRole, 
      isAdmin, 
      hasAnyUsers,
      signUp, 
      signIn, 
      signOut,
      checkHasUsers
    }}>
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