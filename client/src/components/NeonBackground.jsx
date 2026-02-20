function NeonBackground({ children, className = "" }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-[#f5f5f5]" />
      <div className="absolute inset-0 opacity-40">
        <div className="h-full w-full bg-[linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:48px_48px]" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

export default NeonBackground;
