import { connectWallet } from './wallet.js';
import { generateReferralLink, copyRefLink, getReferrerFromURL, registerReferrer } from './referral.js';
import { buyAndStake, loadStakingInfo, claimStakingReward } from './staking.js';
import { loadReferralInfo, claimReferralReward } from './reward.js';

window.connectWallet = connectWallet;
window.copyRefLink = copyRefLink;
window.registerReferrer = registerReferrer;
window.buyAndStake = buyAndStake;
window.claimStakingReward = claimStakingReward;
window.claimReferralReward = claimReferralReward;

export function updateUI() {
  generateReferralLink();
  loadStakingInfo();
  loadReferralInfo();
  getReferrerFromURL();   // ✅ เติมช่อง ref อัตโนมัติทุกครั้งหลังอัปเดต
}

window.addEventListener('load', () => {
  getReferrerFromURL(); // ตอนโหลดครั้งแรก
});
