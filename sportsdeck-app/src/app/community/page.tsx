import AppSidebar from "@/components/layout/AppSidebar";
import CommunityHeader from "@/components/community/CommunityHeader";
import CommunityTabs from "@/components/community/CommunityTabs";
import CommunityPostCard from "@/components/community/CommunityPostCard";
import CommunityPollCard from "@/components/community/CommunityPollCard";
import TrendingTopics from "@/components/community/TrendingTopics";
import QuickPoll from "@/components/community/QuickPoll";
import RecentActivity from "@/components/community/RecentActivity";

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-bg-main text-text-primary flex">
      
      <AppSidebar />

      <main className="flex-1 px-6 py-6">
        <div className="max-w-[1280px] mx-auto">
          
          <CommunityHeader />

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
            
            {/* LEFT */}
            <section className="space-y-4">
              <CommunityTabs />

              <CommunityPostCard />
              <CommunityPollCard />
              <CommunityPostCard />
              <CommunityPostCard />
            </section>

            {/* RIGHT */}
            <aside className="space-y-4">
              <TrendingTopics />
              <QuickPoll />
              <RecentActivity />
            </aside>

          </div>
        </div>
      </main>
    </div>
  );
}