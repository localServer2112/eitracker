import { Card } from '@/components/ui/card';
import { BellOff } from 'lucide-react';

export default function NotificationTab() {
  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
      <Card className="p-10 text-center pointer-events-auto animate-fade-in-up max-w-sm shadow-2xl border-0 rounded-2xl">
        <div className="w-14 h-14 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
          <BellOff className="w-7 h-7 text-muted-foreground/50" />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1.5">
          No Notifications
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You're all caught up! We'll notify you when there are important updates about your fleet.
        </p>
      </Card>
    </div>
  );
}
