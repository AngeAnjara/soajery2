import Link from "next/link"

const links = [
  { href: "/accueil", label: "Accueil" },
  { href: "/divers", label: "Divers" },
  { href: "/nos-lotissements", label: "Nos Lotissements" },
  { href: "/rendez-vous", label: "Rendez-vous" },
  { href: "/verifier-papier", label: "Vérifier Papiers" },
]

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div className="space-y-2">
          <div className="text-lg font-semibold">Soajery</div>
          <p className="text-sm text-muted-foreground">
            Accompagnement immobilier, lotissements et vérification de documents.
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold">Navigation</div>
          <nav className="grid gap-2 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold">Suivez-nous</div>
          <div className="grid gap-2 text-sm text-muted-foreground">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-foreground">
              Facebook
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-foreground">
              Instagram
            </a>
          </div>
        </div>
      </div>

      <div className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Soajery. Tous droits réservés.
      </div>
    </footer>
  )
}
