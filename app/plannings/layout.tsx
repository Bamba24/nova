import '../globals.css'

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes Plannings | Planning",
  description: "Gérez vos plannings et tournées intelligemment",
};


export default function RootLayout({ children }: {children: React.ReactNode}) {
  return (
      
      <div>{children}</div>
  )
}