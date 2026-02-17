import '../globals.css'

export const metadata = {
  title: 'Planning',
  icons: {
    icon: '/logo-nova-blanc.jpg',
  },
}

export default function RootLayout({ children }: {children: React.ReactNode}) {
  return (
      
      <div>{children}</div>
  )
}