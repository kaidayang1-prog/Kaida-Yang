/** 应用标志：屋顶 + 小车，表示“邻居一起开车出门”。和 public/icons/ 里的图标是同一个图形。 */
export function AppMark({ size = 56, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="512" height="512" rx="112" fill="var(--color-accent)" />
      <AppMarkGlyph color="var(--color-accent-fg)" cutout="var(--color-accent)" />
    </svg>
  );
}

/** 图形本身（白色屋顶和小车，窗户和车轮中心镂空成底色） */
export function AppMarkGlyph({ color, cutout }: { color: string; cutout: string }) {
  return (
    <g>
      <polyline
        points="120,214 256,118 392,214"
        fill="none"
        stroke={color}
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M176 302 L206 252 Q214 240 228 240 H284 Q298 240 306 252 L336 302 Z" fill={color} />
      <path d="M112 326 Q112 302 136 302 H376 Q400 302 400 326 V358 Q400 372 386 372 H126 Q112 372 112 358 Z" fill={color} />
      <path d="M214 296 L230 266 Q234 260 241 260 H252 V296 Z" fill={cutout} />
      <path d="M260 296 V260 H271 Q278 260 282 266 L298 296 Z" fill={cutout} />
      <circle cx="176" cy="374" r="34" fill={color} />
      <circle cx="336" cy="374" r="34" fill={color} />
      <circle cx="176" cy="374" r="13" fill={cutout} />
      <circle cx="336" cy="374" r="13" fill={cutout} />
    </g>
  );
}
