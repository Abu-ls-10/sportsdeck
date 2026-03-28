import AppSidebar from "@/components/layout/AppSidebar";
import ThreadsHero from "@/components/threads/ThreadsHero";
import ThreadSearchTabs from "@/components/threads/ThreadSearchTabs";
import ThreadCard from "@/components/threads/ThreadCard";
import StartDiscussionCard from "@/components/threads/StartDiscussionCard";
import QuickPostCard from "@/components/threads/QuickPostCard";
import ActivePollCard from "@/components/threads/ActivePollCard";
import StandingsCard from "@/components/threads/StandingsCard";
import UpcomingMatchCard from "@/components/threads/UpcomingMatchCard";
import TrendingTagsCard from "@/components/threads/TrendingTagsCard";

const threads = [
  {
    pinned: true,
    title:
      "Official Match Thread: Man City vs Real Madrid (UCL Quarter Final)",
    excerpt:
      "Post your predictions, lineups, and live reactions here for the big Champions League clash.",
    tags: ["DISCUSSION LEAGUE", "MATCHDAY"],
    replies: "2.4k",
    meta: "Posted 4h ago by Mod_Kevin",
  },
  {
    title: "Potential Summer Transfers: Who should we target?",
    excerpt:
      "With the window approaching, we need to discuss depth in the squad and realistic targets.",
    tags: ["TRANSFERS"],
    replies: "158",
    meta: "Posted 12h ago by BlueMoon01",
  },
  {
    title: "Erling Haaland stats this season compared to last",
    excerpt:
      "Breaking down the heatmap and xG metrics for our star striker.",
    tags: ["ANALYSIS", "STATS"],
    replies: "89",
    meta: "Posted 1d ago by Statting_City",
  },
];

export default function ThreadsPage() {
  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      <div className="flex min-h-screen">
        <AppSidebar />

        <main className="flex-1 px-4 py-4 md:px-6 lg:px-8">
          <div className="mx-auto max-w-[1280px]">
            <ThreadsHero />

            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <section className="space-y-4">
                <ThreadSearchTabs />

                {threads.map((thread, index) => (
                  <ThreadCard key={index} {...thread} />
                ))}

                <StartDiscussionCard />
              </section>

              <aside className="space-y-4">
                <QuickPostCard />
                <ActivePollCard />
                <StandingsCard />
                <UpcomingMatchCard />
                <TrendingTagsCard />
              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}