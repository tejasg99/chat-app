import Link from "next/link";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      {/* Brand mark */}
      <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center mb-8">
        <MessageCircle className="w-7 h-7 text-on-primary" />
      </div>

      {/* Display number */}
      <h1 className="font-heading text-8xl font-extrabold text-foreground mb-2 leading-none">
        404
      </h1>
      <p className="font-heading text-xl font-bold text-foreground mb-3">
        Page not found
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <Button
        asChild
        className="
          h-10 px-6 rounded-full
          bg-brand-primary hover:bg-brand-secondary-container
          text-on-primary text-sm font-medium
          transition-smooth
        "
      >
        <Link href="/chats">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to chats
        </Link>
      </Button>
    </div>
  );
}
