import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard: already authenticated → skip auth pages
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (token) {
    redirect("/chats");
  }

  return (
    /*
     * Two-column layout on desktop:
     *   Left  — decorative brand panel (hidden on mobile)
     *   Right — form content
     * Single column on mobile.
     */
    <div className="min-h-screen flex bg-background">
      {/* ── Left: Brand Panel ── */}
      <div
        className="
          hidden lg:flex lg:w-[45%] xl:w-1/2
          flex-col justify-between
          bg-surface-container-low
          p-12
          relative overflow-hidden
        "
      >
        {/* Subtle ambient blob */}
        <div
          className="
            absolute -top-32 -left-32 w-96 h-96 rounded-full
            bg-brand-primary opacity-[0.06] blur-3xl pointer-events-none
          "
          aria-hidden="true"
        />
        <div
          className="
            absolute -bottom-24 -right-16 w-80 h-80 rounded-full
            bg-brand-primary-container opacity-[0.08] blur-3xl pointer-events-none
          "
          aria-hidden="true"
        />

        {/* Brand */}
        <div className="relative z-10">
          <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center mb-16">
            <svg
              className="w-5 h-5 text-on-primary"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H6l-4 4V5z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {/* Editorial headline */}
          <h2 className="font-heading text-4xl xl:text-5xl font-extrabold text-foreground leading-tight mb-6">
            Conversations
            <br />
            that <span className="text-brand-primary">matter.</span>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xs">
            A clean, focused space for real conversations — no noise, no
            clutter, just the people you care about.
          </p>
        </div>

        {/* Bottom testimonial / social proof */}
        <div
          className="
            relative z-10
            bg-surface-container-lowest
            rounded-2xl p-6
            shadow-ambient
          "
        >
          <p className="text-sm text-foreground leading-relaxed mb-4">
            &ldquo;Finally a chat app that gets out of its own way. The
            interface just disappears and you&apos;re left with the
            conversation.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-primary-container flex items-center justify-center">
              <span className="text-xs font-bold text-on-primary">A</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Alex R.</p>
              <p className="text-xs text-muted-foreground">Early user</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div
        className="
          flex-1
          flex items-center justify-center
          px-6 py-12 sm:px-12
          bg-background
        "
      >
        {children}
      </div>
    </div>
  );
}
