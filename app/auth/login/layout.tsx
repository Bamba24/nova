import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion | Planning",
  description: "Connectez-vous à votre compte Planning",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}