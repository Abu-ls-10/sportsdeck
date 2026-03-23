import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";

export default function HomePage() {
  return (
    <PageContainer>
      
      {/* FEED */}
      <div className="space-y-4">
        
        <Card>
          <h2 className="font-semibold mb-1">AI Match Insight</h2>
          <p className="text-text-secondary text-sm">
            Manchester City has a 72% chance of winning based on current form.
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold mb-1">Live Match</h2>
          <p className="text-text-secondary text-sm">
            Arsenal 2 - 1 Chelsea (78')
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold mb-1">Thread</h2>
          <p className="text-text-secondary text-sm">
            "Is Haaland the best striker in the world right now?"
          </p>
        </Card>

      </div>

    </PageContainer>
  );
}