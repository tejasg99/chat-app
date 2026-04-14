import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account — ChatApp",
  description: "Create your ChatApp account and start chatting.",
};

export default function SignupPage() {
  return <SignupForm />;
}
