import UserStatsByRole from "../components/UserStatsByRole";
import TopBranchesChart from "../components/TopBranchesChart";

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        <div className="xl:col-span-1 min-h-[400px] flex [&>*]:w-full [&>*]:flex-1">
          <UserStatsByRole />
        </div>

        <div className="xl:col-span-2 min-h-[400px] flex [&>*]:w-full [&>*]:flex-1">
          <TopBranchesChart />
        </div>
      </div>
    </div>
  );
}
