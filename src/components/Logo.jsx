import { Layers3 } from 'lucide-react';

export default function Logo({ small = false }) {
  return (
    <a className={'brand' + (small ? ' brand-small' : '')} href="#inicio" aria-label="Vynex início">
      <span className="brand-mark">
        <Layers3 size={small ? 17 : 20} strokeWidth={2.4} />
      </span>
      <span>vynex<span className="brand-period">.</span></span>
    </a>
  );
}
