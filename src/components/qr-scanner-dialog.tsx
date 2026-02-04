'use client';

import * as React from 'react';
import { Html5QrcodeScanner, Html5QrcodeResult } from 'html5-qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CameraOff, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QrScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
  const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
  const qrboxSize = Math.floor(minEdge * 0.7);
  return {
    width: qrboxSize,
    height: qrboxSize,
  };
};

export function QrScannerDialog({ isOpen, onClose, onScanSuccess }: QrScannerDialogProps) {
  const scannerRef = React.useRef<Html5QrcodeScanner | null>(null);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = React.useState(true);

  React.useEffect(() => {
    if (isOpen) {
      setIsInitializing(true);
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setHasPermission(true);
          const scanner = new Html5QrcodeScanner(
            'reader',
            {
              fps: 10,
              qrbox: qrboxFunction,
              rememberLastUsedCamera: true,
              supportedScanTypes: [],
            },
            false
          );

          const handleSuccess = (decodedText: string, result: Html5QrcodeResult) => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
            onScanSuccess(decodedText);
          };

          const handleError = (errorMessage: string) => {
            // silent errors during scan
          };

          scanner.render(handleSuccess, handleError);
          scannerRef.current = scanner;
          setIsInitializing(false);
        })
        .catch((err) => {
          console.error("Camera access denied:", err);
          setHasPermission(false);
          setIsInitializing(false);
        });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
            console.error("Failed to clear scanner on unmount", error);
        });
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScanSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scanner la commande</DialogTitle>
          <DialogDescription>
            Scannez le QR code présenté par le restaurateur pour valider la prise en charge.
          </DialogDescription>
        </DialogHeader>
        
        {isInitializing && (
            <div className="flex flex-col items-center justify-center p-8 gap-4">
                <Loader className="animate-spin h-12 w-12 text-primary" />
                <p className="text-sm text-muted-foreground">Initialisation de la caméra...</p>
            </div>
        )}

        <div id="reader" className={cn("w-full overflow-hidden rounded-lg", isInitializing && "hidden")}></div>
        
        {hasPermission === false && !isInitializing && (
          <Alert variant="destructive">
            <CameraOff className="h-4 w-4" />
            <AlertTitle>Accès caméra refusé</AlertTitle>
            <AlertDescription>
              Veuillez autoriser l'accès à la caméra dans vos paramètres système pour scanner les commandes.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
