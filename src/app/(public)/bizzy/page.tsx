import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Bizzy | Afters",
};

export default function BizzyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black">
        <h1 className="text-5xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-pulse text-center px-6">
          hello jose is fucking awesome
        </h1>
      </main>
      <Footer />
    </>
  );
}
