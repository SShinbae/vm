import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useWebTitle(title: string) {
  useEffect(() => {
    if (Platform.OS === 'web') {
      const originalTitle = document.title;
      document.title = title;
      
      // Cleanup function to restore original title
      return () => {
        document.title = originalTitle;
      };
    }
  }, [title]);
}

export function setWebTitle(title: string) {
  if (Platform.OS === 'web') {
    document.title = title;
  }
}