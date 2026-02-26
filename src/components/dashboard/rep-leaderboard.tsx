import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Rep = {
  id: number;
  name: string;
  territoryName: string;
  assigned: number;
  active: number;
  won: number;
  revenue: number;
};

type RepLeaderboardProps = {
  reps: Rep[];
};

export function RepLeaderboard({ reps }: RepLeaderboardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Rep Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {reps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No sales reps assigned yet
          </p>
        ) : (
          <div className="space-y-3">
            {reps.map((rep) => (
              <div
                key={rep.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {rep.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{rep.name}</p>
                  <p className="text-xs text-muted-foreground">{rep.territoryName}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-right text-sm">
                  <div>
                    <p className="font-medium">{rep.active}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div>
                    <p className="font-medium text-status-success">{rep.won}</p>
                    <p className="text-xs text-muted-foreground">Won</p>
                  </div>
                  <div>
                    <p className="font-medium">${rep.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Rev</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
