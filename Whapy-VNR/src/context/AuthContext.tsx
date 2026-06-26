import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import type { Profile } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar perfil del usuario
  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error cargando perfil:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Obtener sesión inicial con timeout de seguridad
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error obteniendo sesión:', error);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error en autenticación:', error);
      } finally {
        setLoading(false);
      }
    };

    // Timeout de seguridad: si tarda más de 5 segundos, dejar de cargar
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    initAuth().then(() => clearTimeout(timeout));

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Intentando login con:', email);

      // Timeout de 10 segundos para el login
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Tiempo de espera agotado. Verifica tu conexión.')), 10000);
      });

      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as Awaited<typeof loginPromise>;

      console.log('🔐 Respuesta de Supabase:', { data: data?.user?.email, error: error?.message });

      if (error) throw error;

      // Verificar que el usuario sea admin
      if (data.user) {
        console.log('🔐 Verificando rol de admin...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        console.log('🔐 Perfil:', { role: profileData?.role, error: profileError?.message });

        if (profileError) throw profileError;

        if (profileData?.role !== 'admin') {
          await supabase.auth.signOut();
          return { error: new Error('Acceso denegado. Solo administradores pueden acceder al CRM.') };
        }
      }

      console.log('🔐 Login exitoso');
      return { error: null };
    } catch (error) {
      console.error('🔐 Error en login:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const isAdmin = profile?.role === 'admin';

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
