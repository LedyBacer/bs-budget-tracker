import { miniApp } from '@telegram-apps/sdk-react';
import { HapticButton } from '@/components/ui/haptic-button';

export function Footer() {
  return (
    <footer className="mt-auto border-t px-4 py-4 text-center">
      <HapticButton onClick={() => miniApp.close()} variant="link" size="sm" className="text-destructive">
        Close App
      </HapticButton>
      <p className="text-muted-foreground mt-1 text-xs">MVP v0.1</p>
    </footer>
  );
}
