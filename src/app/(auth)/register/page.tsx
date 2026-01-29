import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your FundSight account and take control of your financial future.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
