import { Header } from "@/components/layout/header";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
