import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account — Chat2vent",
  description: "Create your Chat2vent account and start chatting.",
};

export default function SignupPage() {
  return <SignupForm />;
}
