import { ARCHETYPES } from "@/lib/avatars";

const EYE = "#3A3B45";

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const f = (c: number) =>
    amt < 0 ? Math.round(c * (1 + amt)) : Math.round(c + (255 - c) * amt);
  return "#" + [f(r), f(g), f(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// Tile background per animal.
const BG: Record<string, string> = {
  fox: "#3D9C8F", cat: "#6C7A89", dog: "#4A90D9", bear: "#7F8C8D", panda: "#58B368",
  rabbit: "#E8833A", frog: "#F2C94C", owl: "#566573", penguin: "#48C0C8", pig: "#9B59B6",
  cow: "#7CB342", horse: "#E0A458", monkey: "#5DADE2", lion: "#E07A5F", tiger: "#4DB6AC",
  koala: "#90A4AE", chick: "#E9573F", mouse: "#C39BD3", snake: "#C9A66B", fish: "#2E86C1",
};

function Dots({ x1 = 42, x2 = 58, y = 50, r = 3.6 }) {
  return (
    <>
      <circle cx={x1} cy={y} r={r} fill={EYE} />
      <circle cx={x2} cy={y} r={r} fill={EYE} />
    </>
  );
}

function Face({ kind }: { kind: string }) {
  switch (kind) {
    case "fox":
      return (
        <>
          <path d="M28,44 L22,16 L45,34 Z" fill="#F2894A" />
          <path d="M72,44 L78,16 L55,34 Z" fill="#F2894A" />
          <path d="M28,42 Q50,32 72,42 Q66,64 50,74 Q34,64 28,42 Z" fill="#F2894A" />
          <path d="M40,58 Q50,54 60,58 Q56,70 50,74 Q44,70 40,58 Z" fill="#F7EDE2" />
          <Dots x1={40} x2={60} y={50} />
          <circle cx="50" cy="62" r="3" fill={EYE} />
        </>
      );
    case "cat":
      return (
        <>
          <path d="M30,42 L26,20 L44,34 Z" fill="#AEB6BD" />
          <path d="M70,42 L74,20 L56,34 Z" fill="#AEB6BD" />
          <circle cx="50" cy="52" r="24" fill="#BFC6CC" />
          <Dots x1={41} x2={59} y={50} />
          <path d="M50,56 l-3,3 h6 Z" fill="#EFA3B0" />
          <path d="M50,59 v4" stroke={EYE} strokeWidth="1.4" />
          <g stroke={EYE} strokeWidth="1.3" strokeLinecap="round">
            <line x1="30" y1="55" x2="18" y2="53" />
            <line x1="30" y1="59" x2="18" y2="60" />
            <line x1="70" y1="55" x2="82" y2="53" />
            <line x1="70" y1="59" x2="82" y2="60" />
          </g>
        </>
      );
    case "dog":
      return (
        <>
          <path d="M24,34 Q16,58 30,64 L36,44 Z" fill="#B98A5E" />
          <path d="M76,34 Q84,58 70,64 L64,44 Z" fill="#C79A6E" />
          <circle cx="50" cy="50" r="24" fill="#D9B38C" />
          <ellipse cx="63" cy="46" rx="10" ry="9" fill="#B98A5E" />
          <Dots x1={42} x2={58} y={48} />
          <ellipse cx="50" cy="62" rx="14" ry="9" fill="#EFE3D2" />
          <ellipse cx="50" cy="60" rx="4" ry="3" fill={EYE} />
        </>
      );
    case "bear":
      return (
        <>
          <circle cx="30" cy="30" r="11" fill="#B98A5E" />
          <circle cx="70" cy="30" r="11" fill="#B98A5E" />
          <circle cx="50" cy="52" r="25" fill="#C79A6E" />
          <ellipse cx="50" cy="60" rx="13" ry="10" fill="#EAD7B8" />
          <Dots x1={42} x2={58} y={48} />
          <ellipse cx="50" cy="57" rx="4" ry="3" fill={EYE} />
        </>
      );
    case "panda":
      return (
        <>
          <circle cx="30" cy="30" r="11" fill="#2F343B" />
          <circle cx="70" cy="30" r="11" fill="#2F343B" />
          <circle cx="50" cy="52" r="25" fill="#F4F6F8" />
          <ellipse cx="41" cy="50" rx="7" ry="9" fill="#2F343B" transform="rotate(18 41 50)" />
          <ellipse cx="59" cy="50" rx="7" ry="9" fill="#2F343B" transform="rotate(-18 59 50)" />
          <circle cx="41" cy="50" r="2.6" fill="#fff" />
          <circle cx="59" cy="50" r="2.6" fill="#fff" />
          <ellipse cx="50" cy="62" rx="3.4" ry="2.6" fill="#2F343B" />
        </>
      );
    case "rabbit":
      return (
        <>
          <ellipse cx="41" cy="24" rx="7" ry="19" fill="#EFEFF2" />
          <ellipse cx="59" cy="24" rx="7" ry="19" fill="#EFEFF2" />
          <ellipse cx="41" cy="24" rx="3" ry="12" fill="#F7B9C4" />
          <ellipse cx="59" cy="24" rx="3" ry="12" fill="#F7B9C4" />
          <circle cx="50" cy="55" r="23" fill="#F4F4F7" />
          <Dots x1={42} x2={58} y={53} />
          <path d="M50,58 l-2.5,3 h5 Z" fill="#F7B9C4" />
        </>
      );
    case "frog":
      return (
        <>
          <circle cx="37" cy="34" r="12" fill="#7BCB66" />
          <circle cx="63" cy="34" r="12" fill="#7BCB66" />
          <circle cx="37" cy="33" r="4" fill={EYE} />
          <circle cx="63" cy="33" r="4" fill={EYE} />
          <path d="M24,48 a26,22 0 0 0 52,0 Z" fill="#6FBF5A" />
          <path d="M38,58 Q50,66 62,58" fill="none" stroke={shade("#6FBF5A", -0.3)} strokeWidth="2.4" strokeLinecap="round" />
        </>
      );
    case "owl":
      return (
        <>
          <path d="M30,36 L26,20 L42,30 Z" fill="#A9744F" />
          <path d="M70,36 L74,20 L58,30 Z" fill="#A9744F" />
          <circle cx="50" cy="52" r="25" fill="#B5825C" />
          <circle cx="41" cy="49" r="10" fill="#F4EAD8" />
          <circle cx="59" cy="49" r="10" fill="#F4EAD8" />
          <circle cx="41" cy="49" r="4" fill={EYE} />
          <circle cx="59" cy="49" r="4" fill={EYE} />
          <path d="M50,56 l-4,6 h8 Z" fill="#F2A649" />
        </>
      );
    case "penguin":
      return (
        <>
          <circle cx="50" cy="50" r="26" fill="#2F343B" />
          <path d="M32,52 a18,22 0 0 1 36,0 Z" fill="#F4F6F8" />
          <Dots x1={43} x2={57} y={44} />
          <path d="M50,50 l-6,5 6,5 6,-5 Z" fill="#F2A649" />
        </>
      );
    case "pig":
      return (
        <>
          <path d="M30,34 L24,24 L40,34 Z" fill="#F0A9C0" />
          <path d="M70,34 L76,24 L60,34 Z" fill="#F0A9C0" />
          <circle cx="50" cy="53" r="25" fill="#F5B7CC" />
          <Dots x1={42} x2={58} y={48} />
          <ellipse cx="50" cy="62" rx="12" ry="9" fill="#EF9BB6" />
          <circle cx="46" cy="62" r="2.4" fill={EYE} />
          <circle cx="54" cy="62" r="2.4" fill={EYE} />
        </>
      );
    case "cow":
      return (
        <>
          <path d="M24,40 L16,34 L26,30 Z" fill="#E9E4DA" />
          <path d="M76,40 L84,34 L74,30 Z" fill="#E9E4DA" />
          <path d="M30,32 q6,-8 12,-4 q-2,8 -8,10 Z" fill="#9AA0A6" />
          <circle cx="50" cy="52" r="25" fill="#F4F1EA" />
          <path d="M62,40 a11,11 0 1 1 -0.1,0 Z" fill="#9AA0A6" />
          <Dots x1={42} x2={60} y={48} />
          <ellipse cx="50" cy="64" rx="14" ry="10" fill="#F3C9D2" />
          <circle cx="45" cy="64" r="2.4" fill={EYE} />
          <circle cx="55" cy="64" r="2.4" fill={EYE} />
        </>
      );
    case "horse":
      return (
        <>
          <path d="M34,26 L30,44 L42,40 Z" fill="#5A3E2B" />
          <path d="M66,26 L70,44 L58,40 Z" fill="#5A3E2B" />
          <path d="M40,20 Q50,16 60,20 L58,40 L42,40 Z" fill="#7A5233" />
          <path d="M32,44 Q50,34 68,44 L60,72 Q50,78 40,72 Z" fill="#9C6B3F" />
          <path d="M42,60 Q50,56 58,60 L56,72 Q50,76 44,72 Z" fill="#C79A6E" />
          <Dots x1={42} x2={58} y={50} />
        </>
      );
    case "monkey":
      return (
        <>
          <circle cx="28" cy="46" r="10" fill="#8A5A38" />
          <circle cx="72" cy="46" r="10" fill="#8A5A38" />
          <circle cx="28" cy="46" r="5" fill="#C79A6E" />
          <circle cx="72" cy="46" r="5" fill="#C79A6E" />
          <circle cx="50" cy="50" r="24" fill="#8A5A38" />
          <path d="M32,54 a20,17 0 0 1 36,0 a18,15 0 0 1 -36,0 Z" fill="#E6C9A8" />
          <Dots x1={43} x2={57} y={46} />
          <ellipse cx="50" cy="60" rx="2.6" ry="1.8" fill={EYE} />
        </>
      );
    case "lion":
      return (
        <>
          <g fill="#C8792E">
            <circle cx="50" cy="22" r="9" /><circle cx="28" cy="30" r="9" />
            <circle cx="72" cy="30" r="9" /><circle cx="20" cy="50" r="9" />
            <circle cx="80" cy="50" r="9" /><circle cx="26" cy="70" r="9" />
            <circle cx="74" cy="70" r="9" /><circle cx="50" cy="78" r="9" />
          </g>
          <circle cx="50" cy="50" r="25" fill="#E8A85C" />
          <ellipse cx="50" cy="58" rx="12" ry="9" fill="#F3D9AE" />
          <Dots x1={42} x2={58} y={48} />
          <path d="M50,55 l-3,3 h6 Z" fill={EYE} />
        </>
      );
    case "tiger":
      return (
        <>
          <path d="M30,42 L26,22 L44,34 Z" fill="#F2894A" />
          <path d="M70,42 L74,22 L56,34 Z" fill="#F2894A" />
          <circle cx="50" cy="52" r="25" fill="#F2A24A" />
          <path d="M34,58 Q50,52 66,58 Q58,74 50,76 Q42,74 34,58 Z" fill="#F7EEDD" />
          <g stroke="#2F343B" strokeWidth="2.4" strokeLinecap="round">
            <line x1="34" y1="34" x2="38" y2="42" />
            <line x1="66" y1="34" x2="62" y2="42" />
            <line x1="28" y1="50" x2="34" y2="50" />
            <line x1="72" y1="50" x2="66" y2="50" />
          </g>
          <Dots x1={42} x2={58} y={50} />
          <path d="M50,58 l-3,3 h6 Z" fill={EYE} />
        </>
      );
    case "koala":
      return (
        <>
          <circle cx="26" cy="42" r="13" fill="#AEB9C0" />
          <circle cx="74" cy="42" r="13" fill="#AEB9C0" />
          <circle cx="26" cy="42" r="7" fill="#D8DEE3" />
          <circle cx="74" cy="42" r="7" fill="#D8DEE3" />
          <circle cx="50" cy="52" r="24" fill="#BFC7CD" />
          <Dots x1={42} x2={58} y={49} />
          <ellipse cx="50" cy="60" rx="7" ry="9" fill="#4A4E57" />
        </>
      );
    case "chick":
      return (
        <>
          <path d="M50,20 L44,30 L56,30 Z" fill="#F2C94C" />
          <circle cx="50" cy="53" r="25" fill="#F5D033" />
          <Dots x1={42} x2={58} y={49} />
          <path d="M50,56 l-7,5 7,4 7,-4 Z" fill="#F0913C" />
        </>
      );
    case "mouse":
      return (
        <>
          <circle cx="28" cy="34" r="15" fill="#C0C7CD" />
          <circle cx="72" cy="34" r="15" fill="#C0C7CD" />
          <circle cx="28" cy="34" r="9" fill="#F1C0CC" />
          <circle cx="72" cy="34" r="9" fill="#F1C0CC" />
          <circle cx="50" cy="54" r="22" fill="#CCD2D7" />
          <Dots x1={43} x2={57} y={52} />
          <path d="M50,58 l-2.5,3 h5 Z" fill="#EF9BB6" />
        </>
      );
    case "snake":
      return (
        <>
          <path d="M28,44 Q50,26 72,44 Q76,64 50,72 Q24,64 28,44 Z" fill="#6FBF5A" />
          <path d="M36,48 Q50,40 64,48 Q66,60 50,66 Q34,60 36,48 Z" fill="#8FD97C" />
          <ellipse cx="42" cy="48" rx="4" ry="5.5" fill="#F2C94C" />
          <ellipse cx="58" cy="48" rx="4" ry="5.5" fill="#F2C94C" />
          <path d="M42,46 v4 M58,46 v4" stroke={EYE} strokeWidth="1.8" />
          <path d="M50,66 v6 M50,72 l-3,3 M50,72 l3,3" stroke="#E0413B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </>
      );
    default: // fish
      return (
        <>
          <path d="M70,52 L88,40 L84,52 L88,64 Z" fill="#F0913C" />
          <path d="M50,30 Q60,38 58,50 Q52,44 46,42 Z" fill="#F0913C" />
          <ellipse cx="46" cy="54" rx="26" ry="20" fill="#F5A623" />
          <path d="M30,54 Q22,48 20,54 Q22,60 30,54 Z" fill="#F0913C" />
          <circle cx="40" cy="50" r="4.6" fill="#fff" />
          <circle cx="40" cy="50" r="2.6" fill={EYE} />
          <path d="M30,58 Q34,62 40,60" fill="none" stroke={shade("#F5A623", -0.3)} strokeWidth="2" strokeLinecap="round" />
        </>
      );
  }
}

export function AvatarArt({
  index,
  size = 32,
}: {
  index: number;
  size?: number;
}) {
  const i =
    ((index % ARCHETYPES.length) + ARCHETYPES.length) % ARCHETYPES.length;
  const kind = ARCHETYPES[i];
  const bg = BG[kind];
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        overflow: "hidden",
        display: "inline-block",
        flexShrink: 0,
        background: bg,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        {/* subtle flat "long shadow" split */}
        <polygon points="100,0 100,100 0,100" fill={shade(bg, -0.5)} opacity="0.16" />
        <Face kind={kind} />
      </svg>
    </span>
  );
}
