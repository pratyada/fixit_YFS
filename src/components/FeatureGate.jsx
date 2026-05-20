import { useSubscription } from '../contexts/SubscriptionContext';
import UpgradePrompt from './UpgradePrompt';

export default function FeatureGate({ feature, children, fallback, compact = false }) {
  const { canUseFeature } = useSubscription();

  if (canUseFeature(feature)) {
    return children;
  }

  if (fallback) return fallback;

  return <UpgradePrompt feature={feature} compact={compact} />;
}
