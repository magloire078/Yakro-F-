
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
  
  return (
    <Card className="shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <p className="font-bold font-headline">{review.nomUtilisateur}</p>
              <StarRating rating={review.note} />
            </div>
            <p className="text-muted-foreground">{review.commentaire}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
