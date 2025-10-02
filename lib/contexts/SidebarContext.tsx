import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  isCollapsed: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps {
  children: React.ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  // Default to open on desktop, closed on smaller screens
  const [isOpen, setIsOpen] = useState(true);

  // Load saved preference from localStorage on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        // Check if localStorage is available (web only)
        if (typeof window !== 'undefined' && window.localStorage) {
          const saved = window.localStorage.getItem('sidebar-state');
          if (saved !== null) {
            setIsOpen(saved === 'open');
          }
        }
      } catch (error) {
        // Silently fail if localStorage is not available
        console.warn('localStorage not available:', error);
      }
    }
  }, []);

  // Save preference to localStorage on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        // Check if localStorage is available (web only)
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('sidebar-state', isOpen ? 'open' : 'closed');
        }
      } catch (error) {
        // Silently fail if localStorage is not available
        console.warn('localStorage not available:', error);
      }
    }
  }, [isOpen]);

  const toggle = () => setIsOpen(prev => !prev);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{
      isOpen,
      toggle,
      open,
      close,
      isCollapsed: !isOpen,
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}