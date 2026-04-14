import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In — ChatApp",
  description: "Sign in to your ChatApp account.",
};

export default function LoginPage() {
  return <LoginForm />;
}
