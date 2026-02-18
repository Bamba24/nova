import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard Admin | Planning",
  description: "Tableau de bord administrateur",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}