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
  /** Acceso al CRM (admin, operator o auditor) */
  isCrmUser: boolean;
  /** Solo lectura (auditor) */
  isReadOnly: boolean;
  /** Puede crear/editar operaciones */
  canWrite: boolean;
  /** Super Admin */
  isSuperAdmin: boolean;
  /** @deprecated usar isCrmUser */
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
    // IMPORTANTE: No hacer llamadas a Supabase DB dentro de este callback
    // porque el SDK notifica dentro de un lock, y hacer queries re-entra
    // en getSession() causando un deadlock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Cargar perfil fuera del lock del SDK usando setTimeout
          setTimeout(() => loadProfile(session.user!.id), 0);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          return { error: new Error('Email o contraseña incorrectos.') };
        }
        return { error: new Error(error.message) };
      }

      // Verificar que el usuario sea admin
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        const allowedRoles = ['admin', 'operator', 'auditor'];
        if (!profileData?.role || !allowedRoles.includes(profileData.role)) {
          await supabase.auth.signOut();
          return { error: new Error('Acceso denegado. Solo personal autorizado del CRM puede ingresar.') };
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error en login:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const role = profile?.role;
  const isCrmUser = role === 'admin' || role === 'operator' || role === 'auditor';
  const isReadOnly = role === 'auditor';
  const canWrite = role === 'admin' || role === 'operator';
  const isSuperAdmin = role === 'admin';
  const isAdmin = isCrmUser;

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signOut,
    isCrmUser,
    isReadOnly,
    canWrite,
    isSuperAdmin,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
