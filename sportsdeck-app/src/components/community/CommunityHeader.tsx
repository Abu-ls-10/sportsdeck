export default function CommunityHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Community Hub
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Join league-wide discussion with thousands of fans
        </p>
      </div>

      <button className="bg-gradient-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-glow hover:brightness-110 transition">
        + Start a Discussion
      </button>
    </div>
  );
}