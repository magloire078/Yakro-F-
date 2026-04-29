import Image from 'next/image';
import type { Review } from '@/lib/types';
import { Card, CardContent } from './ui/card';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';

interface ReviewCardProps {
  review: Review;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

export function ReviewCard({ review }: ReviewCardProps) {
  const initial = review.nomUtilisateur ? review.nomUtilisateur.charAt(0).toUpperCase() : '?';
  const formattedDate = review.date
    ? new Date(review.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <Card className="shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2 gap-2">
              <div>
                <p className="font-bold font-headline">{review.nomUtilisateur}</p>
                {formattedDate && <p className="text-xs text-muted-foreground">{formattedDate}</p>}
              </div>
              <StarRating rating={review.note} />
            </div>
            <p className="text-muted-foreground whitespace-pre-line">{review.commentaire}</p>
            {review.imageUrl && (
              <div className="mt-3 relative h-48 w-full max-w-sm rounded-md overflow-hidden border">
                <Image
                  src={review.imageUrl}
                  alt={`Photo de ${review.nomUtilisateur}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
