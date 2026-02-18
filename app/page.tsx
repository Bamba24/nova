import Image from "next/image";
import Link from "next/link";


export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-blue-50 to-slate-100">
      <main className="flex flex-col items-center justify-center gap-8 px-8 py-16 text-center">
        
        {/* Logo */}
        <div className="mb-4">
          <Image
            src="/logo-nova-blanc.jpg"
            alt="Logo Planning"
            width={120}
            height={120}
            priority
            className="drop-shadow-lg"
          />
        </div>

        {/* Titre de bienvenue */}
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl font-bold text-gray-800 tracking-tight">
            Bienvenue sur Planning
          </h1>
          <p className="text-xl text-gray-600 max-w-md">
            Gérez vos tournées et plannings intelligemment avec l&apos;aide de l&apos;IA
          </p>
        </div>

        {/* Bouton de connexion */}
        <Link
          href="/auth/login"
          className="mt-6 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95"
        >
          Se connecter
        </Link>

        {/* Texte secondaire */}
        <p className="text-sm text-gray-500 mt-4">
          Pas encore de compte ?{" "}
          <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">
            Créer un compte
          </Link>
        </p>
      </main>
    </div>
  );
}