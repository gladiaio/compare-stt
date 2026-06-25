import Image from "next/image";
import Link from "next/link";
import { PROVIDERS } from "@/lib/providers";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const APPLY_MAILTO =
  "mailto:privacy@gladia.io?subject=Apply%20to%20be%20featured%20on%20Compare%20STT";

export function HeroProviderLogos() {
  return (
    <div className="mt-4 flex flex-col items-center gap-5">
      <span
        className="font-mono text-xs uppercase tracking-[0.16em]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        Featuring
      </span>
      <ul
        className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
        aria-label="Speech-to-text providers compared"
      >
        {PROVIDERS.map((provider) => (
          <li key={provider.slug}>
            <div className="relative h-5 w-24 opacity-50 transition-opacity duration-160 hover:opacity-80 md:h-6 md:w-28">
              <Image
                src={`${BASE_PATH}${provider.logoUrl}`}
                alt={provider.name}
                fill
                className="object-contain object-center"
              />
            </div>
          </li>
        ))}
        <li>
          <Link
            href={APPLY_MAILTO}
            className="group relative block h-5 w-28 md:h-6 md:w-32"
            aria-label="Apply to be featured on Compare STT"
          >
            <div
              className="absolute inset-0 flex items-center justify-center opacity-75 transition-opacity duration-160 group-hover:opacity-95"
              aria-hidden="true"
              style={{ filter: "blur(2px)", WebkitFilter: "blur(2px)" }}
            >
              <div className="flex h-full w-full items-center gap-1.5 px-0.5">
                <div
                  className="h-4 w-4 shrink-0 rounded-md md:h-[18px] md:w-[18px]"
                  style={{ background: "var(--color-text-secondary)" }}
                />
                <div
                  className="h-2.5 flex-1 rounded-full md:h-3"
                  style={{ background: "var(--color-text-secondary)" }}
                />
              </div>
            </div>
            <span
              className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-[15px] font-medium leading-none tracking-tight transition-colors duration-160"
              style={{
                color: "var(--color-text-primary)",
                textShadow: "0 0 10px var(--color-bg-primary), 0 0 3px var(--color-bg-primary)",
              }}
            >
              Apply to be featured →
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
