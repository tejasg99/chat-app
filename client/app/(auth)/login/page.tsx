import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — Chat2vent",
  description: "Sign in to your Chat2vent account.",
};

export default function LoginPage() {
  return <LoginForm />;
}
