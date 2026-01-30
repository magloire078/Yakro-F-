
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
        type: 'image/png',
        quality: 0.9,
        margin: 1,
        width: 256,
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error(err);
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
          {isLoading && <Loader className="animate-spin h-16 w-16" />}
          {qrCodeUrl && (
            <Image src={qrCodeUrl} alt={`QR Code for order ${orderId}`} width={256} height={256} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
