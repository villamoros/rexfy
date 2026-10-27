import Link from "next/link";

// Traced from marca/svg/rexfy-logo-horizontal-*.svg (Manrope ExtraBold in outlines).
const WORDMARK =
  "M140 1440V0H748Q769 0 804.5 1.5Q840 3 868 8Q997 28 1079.5 93.0Q1162 158 1201.0 256.5Q1240 355 1240 476Q1240 657 1150.0 785.5Q1060 914 868 944L748 952H412V1440ZM952 1440 668 854 948 800 1260 1440ZM412 698H736Q757 698 782.0 696.0Q807 694 828 688Q883 673 913.0 637.5Q943 602 954.5 558.5Q966 515 966 476Q966 437 954.5 393.5Q943 350 913.0 314.5Q883 279 828 264Q807 258 782.0 256.0Q757 254 736 254H412Z M1932.0 1470Q1766.0 1470 1639.5 1398.5Q1513.0 1327 1441.5 1201.5Q1370.0 1076 1370.0 914Q1370.0 737 1440.0 606.0Q1510.0 475 1633.0 402.5Q1756.0 330 1916.0 330Q2086.0 330 2205.0 410.0Q2324.0 490 2381.0 635.0Q2438.0 780 2421.0 976H2152.0V876Q2152.0 711 2099.5 638.5Q2047.0 566 1928.0 566Q1789.0 566 1723.5 650.5Q1658.0 735 1658.0 900Q1658.0 1051 1723.5 1133.5Q1789.0 1216 1916.0 1216Q1996.0 1216 2053.0 1181.0Q2110.0 1146 2140.0 1080L2412.0 1158Q2351.0 1306 2219.5 1388.0Q2088.0 1470 1932.0 1470ZM1574.0 976V774H2290.0V976Z M2476.0 1440 2862.0 894 2484.0 360H2804.0L3020.0 680L3232.0 360H3552.0L3174.0 894L3562.0 1440H3242.0L3020.0 1108L2796.0 1440Z M3672.0 1440V0H4552.0V272H3944.0V584H4432.0V856H3944.0V1440Z M4820.0 1920 5028.0 1348 5032.0 1516 4562.0 360H4844.0L5160.0 1178H5096.0L5410.0 360H5682.0L5072.0 1920Z";

/** The three-module symbol: stem and bowl follow `currentColor`, the leg is Señal. */
function SymbolModules() {
  return (
    <>
      <rect width="10" height="40" rx="1.5" fill="currentColor" />
      <path d="M14 0H26a10 10 0 0 1 0 20H14z" fill="currentColor" />
      <path d="M14 24h10l12 16H26z" fill="var(--signal)" />
    </>
  );
}

/** Horizontal RexFy logo. Its color follows `currentColor`; the leg stays Señal. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex h-7 shrink-0 ${className}`}>
      <svg
        viewBox="0 0 140.37 40"
        className="h-full w-auto"
        role="img"
        aria-label="RexFy"
      >
        <SymbolModules />
        <path
          transform="translate(45.667 8) scale(0.016667)"
          d={WORDMARK}
          fill="currentColor"
        />
      </svg>
    </Link>
  );
}
