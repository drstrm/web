import SmartLink from "@/components/SmartLink";
import { CONTACTS, SITE, SOCIALS } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-16 border-t bg-surface/60">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <p className="font-extrabold">{SITE.name}</p>
            <p className="mt-1 text-sm text-muted">{SITE.description}</p>
            {/* 팀 이메일 (운영진 구글 계정) */}
            <SmartLink
              href={`mailto:${SITE.email}`}
              className="mt-3 inline-block text-sm font-semibold text-sky-600"
            >
              ✉️ {SITE.email}
            </SmartLink>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                Social
              </p>
              <div className="flex flex-wrap gap-2">
                {SOCIALS.map((s) => (
                  <SmartLink
                    key={s.label}
                    href={s.href}
                    className="rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-sky-50"
                  >
                    {s.label}
                  </SmartLink>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                Contact
              </p>
              <div className="flex flex-wrap gap-2">
                {CONTACTS.map((c) => (
                  <SmartLink
                    key={c.label}
                    href={c.href}
                    className="rounded-full accent-gradient px-3 py-1.5 text-xs font-bold text-[#5a4a1f] shadow-sm"
                  >
                    💬 {c.label}
                  </SmartLink>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          © {new Date().getFullYear()} {SITE.name}
        </p>
      </div>
    </footer>
  );
}
