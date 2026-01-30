
'use client';

import * as React from 'react';
import { Html5QrcodeScanner, Html5QrcodeError, Html5QrcodeResult } from 'html5-qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CameraOff } from 'lucide-react';

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

  React.useEffect(() => {
    if (isOpen) {
      // Check for camera permissions first
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setHasPermission(true);
          // Initialize scanner
          const scanner = new Html5QrcodeScanner(
            'reader',
            {
              fps: 10,
              qrbox: qrboxFunction,
              rememberLastUsedCamera: true,
              supportedScanTypes: [], // Use all supported types
            },
            false // verbose
          );

          const handleSuccess = (decodedText: string, result: Html5QrcodeResult) => {
            scanner.clear();
            onScanSuccess(decodedText);
          };

          const handleError = (errorMessage: string) => {
            // ignore errors
          };

          scanner.render(handleSuccess, handleError);
          scannerRef.current = scanner;
        })
        .catch(() => {
          setHasPermission(false);
        });
    }

    return () => {
      if (scannerRef.current) {
        // Checking state before clearing to avoid errors on fast close
        if (scannerRef.current.getState() !== 1) { // 1 is NOT_STARTED
            scannerRef.current.clear().catch(error => {
                console.error("Failed to clear html5-qrcode-scanner.", error);
            });
        }
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScanSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scanner la commande</DialogTitle>
          <DialogDescription>
            Scannez le QR code présenté par le restaurateur pour récupérer la commande.
          </DialogDescription>
        </DialogHeader>
        <div id="reader" className="w-full"></div>
        {hasPermission === false && (
          <Alert variant="destructive">
            <CameraOff className="h-4 w-4" />
            <AlertTitle>Accès à la caméra refusé</AlertTitle>
            <AlertDescription>
              Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour utiliser le scanner.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}
