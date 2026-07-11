import { useFeatures } from '@/context/FeatureContext';
import { Crown, ShieldX } from 'lucide-react';

export default function FeatureRouteGuard({ featureCode, featureName, children }) {
    const { isFeatureActive } = useFeatures();

    if (isFeatureActive(featureCode)) {
        return <>{children}</>;
    }

    return (
        <div className="flex items-center justify-center h-full min-h-[60vh] bg-gray-50/50 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[30%] left-[25%] w-72 h-72 bg-amber-400/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[25%] right-[20%] w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 text-center p-12 bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/80 max-w-lg mx-auto">
                <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 mb-6">
                    <ShieldX size={48} className="text-amber-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {featureName || 'Feature'} is Locked
                </h2>
                <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
                    This premium module is not activated for your system.
                    Please contact your system administrator to purchase and enable this feature.
                </p>

                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold shadow-lg">
                    <Crown size={16} />
                    Premium Feature — Contact Admin
                </div>
            </div>
        </div>
    );
}
