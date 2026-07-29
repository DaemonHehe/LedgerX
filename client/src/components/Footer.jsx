export default function Footer() {
  return (
    <footer className="bg-[var(--bg-primary)] border-t border-[var(--line)] py-8 px-6 text-center mt-auto">
      <p className="font-mono text-xs text-[var(--ink-soft)] uppercase tracking-widest">
        © {new Date().getFullYear()} LedgerX System. All rights reserved.
      </p>
      <p className="font-mono text-[10px] text-[var(--ink-soft)] opacity-70 uppercase tracking-widest mt-2">
        Developed by DaemonBerg
      </p>
    </footer>
  );
}
