
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
    <Card className="glass rounded-xl sm:rounded-2xl border-white/5 hover:border-primary/20 transition-all duration-300 shadow-xs hover:shadow-md">
      <CardContent className="p-3.5 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <Avatar className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl border border-primary/20 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-black text-xs sm:text-sm">{initial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1 gap-2">
              <p className="font-bold font-headline text-xs sm:text-sm text-foreground truncate">{review.nomUtilisateur}</p>
              <StarRating rating={review.note} />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">&ldquo;{review.commentaire}&rdquo;</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
