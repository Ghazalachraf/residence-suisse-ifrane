import { Saison } from '@/lib/utils';

const ARBRES = [40, 95, 150, 330, 395, 610, 700, 760, 930, 1010, 1080, 1150];

/** Silhouette de l'Atlas et des cèdres d'Ifrane, teintée selon la saison. */
export default function Mountains({ s, className = '' }: { s: Saison; className?: string }) {
  const hiver = s.nom === 'Hiver';
  return (
    <svg viewBox="0 0 1200 150" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <path
        d="M0 96 90 58 150 80 250 30 330 72 420 50 520 88 640 26 730 70 820 48 930 84 1030 36 1120 70 1200 52V150H0Z"
        fill={s.accent} opacity="0.45"
      />
      {hiver && (
        <path d="M250 30l-22 16 12-3 10 8 9-9 13 4zM640 26l-24 18 13-3 11 8 10-9 14 4zM1030 36l-20 15 11-2 9 7 8-8 12 3z" fill="#FBFAF6" />
      )}
      <path d="M0 112 120 82 210 104 330 70 450 100 560 78 690 108 800 84 910 106 1040 80 1200 104V150H0Z" fill="#2F5D4A" />
      <g fill="#1E3A2F">
        {ARBRES.map((x, i) => {
          const h = i % 3 === 0 ? 40 : i % 3 === 1 ? 30 : 34;
          const y = 140 - h;
          return <path key={x} d={`M${x} ${y}l-10 ${h * 0.4}h6l-10 ${h * 0.32}h8l-9 ${h * 0.28}h30l-9-${h * 0.28}h8l-10-${h * 0.32}h6z`} />;
        })}
      </g>
      <path d="M0 134c160-8 340-10 600-4s420 6 600-4v24H0Z" fill="#1E3A2F" />
    </svg>
  );
}
