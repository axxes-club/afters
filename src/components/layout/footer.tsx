import Link from "next/link";

const footerLinks = {
  Platform: [
    { label: "Radio", href: "/radio" },
    { label: "Status", href: "/status" },
  ],
  Organizers: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "New Event", href: "/dashboard/events/new" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-1 mb-4">
              <span className="text-2xl font-bold font-display text-white">
                AFTERS
              </span>
              <span className="text-[#ff1493] text-2xl font-bold">.</span>
            </Link>
            <p className="text-sm text-white/40 leading-relaxed max-w-[220px]">
              The nightlife ticketing platform with the lowest fees. Built for
              promoters, by people who get it.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="text-xs font-display font-bold tracking-widest text-white/60 uppercase mb-4">
                {heading}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/40 hover:text-[#ff1493] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/30">
            &copy; {new Date().getFullYear()} Afters. All rights reserved.
          </p>
          <p className="text-xs text-white/30">
            from{" "}
            <a
              href="https://crativo.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ff1493] hover:text-[#ff69b4] transition-colors"
            >
              jose
            </a>{" "}
            with love
          </p>
        </div>
      </div>
    </footer>
  );
}
