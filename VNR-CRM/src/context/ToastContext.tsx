import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import toast, { Toaster, ToastOptions } from 'react-hot-toast';

interface ToastContextType {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  dismiss: (toastId?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

const baseStyle = {
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
  fontWeight: '500',
};

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const success = useCallback((message: string, options?: ToastOptions) => {
    toast.success(message, {
      duration: 4000,
      style: {
        ...baseStyle,
        background: '#dcfce7',
        color: '#166534',
        border: '1px solid #bbf7d0',
      },
      iconTheme: {
        primary: '#16a34a',
        secondary: '#dcfce7',
      },
      ...options,
    });
  }, []);

  const error = useCallback((message: string, options?: ToastOptions) => {
    toast.error(message, {
      duration: 5000,
      style: {
        ...baseStyle,
        background: '#fef2f2',
        color: '#991b1b',
        border: '1px solid #fecaca',
      },
      iconTheme: {
        primary: '#dc2626',
        secondary: '#fef2f2',
      },
      ...options,
    });
  }, []);

  const info = useCallback((message: string, options?: ToastOptions) => {
    toast(message, {
      duration: 4000,
      icon: 'ℹ️',
      style: {
        ...baseStyle,
        background: '#eff6ff',
        color: '#1e40af',
        border: '1px solid #bfdbfe',
      },
      ...options,
    });
  }, []);

  const warning = useCallback((message: string, options?: ToastOptions) => {
    toast(message, {
      duration: 4000,
      icon: '⚠️',
      style: {
        ...baseStyle,
        background: '#fefce8',
        color: '#854d0e',
        border: '1px solid #fef08a',
      },
      ...options,
    });
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }, []);

  const value = useMemo(
    () => ({
      success,
      error,
      info,
      warning,
      dismiss,
    }),
    [success, error, info, warning, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        gutter={8}
        containerStyle={{
          top: 20,
          right: 20,
        }}
        toastOptions={{
          duration: 4000,
        }}
      />
    </ToastContext.Provider>
  );
};

export default ToastContext;
