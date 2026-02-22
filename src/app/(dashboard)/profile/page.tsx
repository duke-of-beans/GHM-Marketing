import { UserCircle } from "lucide-react";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ResetToursCard } from "@/components/tutorials/ResetToursCard";

export default function ProfilePage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserCircle className="h-8 w-8" />
          My Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and password
        </p>
      </div>

      <ProfileForm />
      <ResetToursCard />
    </div>
  );
}
