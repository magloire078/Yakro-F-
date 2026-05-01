
'use client';

import * as React from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { Loader } from 'lucide-react';

interface QrCodeDialogProps {
  orderId: string;
  children: React.ReactNode;
}

export function QrCodeDialog({ orderId, children }: QrCodeDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const generateQrCode = async () => {
    if (qrCodeUrl) return;
    setIsLoading(true);
    try {
      const url = await QRCode.toDataURL(orderId, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 256,
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => open && generateQrCode()}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Validation de la commande</DialogTitle>
          <DialogDescription>
            Le livreur doit scanner ce code pour récupérer la commande n°{orderId.slice(0, 6)}...
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          {isLoading && <Loader className="animate-spin h-16 w-16 text-primary" />}
          {qrCodeUrl && (
            <div className="relative w-64 h-64 border-4 border-primary rounded-lg overflow-hidden">
                <Image 
                  src={qrCodeUrl} 
                  alt={`QR Code order ${orderId}`} 
                  fill 
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-contain" 
                />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
