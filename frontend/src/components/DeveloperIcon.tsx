

export default function DeveloperIcon() {
  return (
    <a 
      href="https://portfolio-vrinda-seven.vercel.app/" 
      target="_blank" 
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-3 group transition-transform hover:scale-105"
      title="Know the Developer"
    >
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-marker-blue shadow-lg shadow-marker-blue/20">
        <img 
          src="https://portfolio-vrinda-seven.vercel.app/profile.jpg" 
          alt="Vrinda Vishnoi" 
          className="w-full h-full object-cover bg-white"
        />
      </div>
      <div className="bg-card px-3 py-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border-2 border-ink/10">
        <span className="font-marker text-ink text-sm">Know the Developer</span>
      </div>
    </a>
  );
}
