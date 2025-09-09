// js/app.js
import { connectWallet } from './wallet.js';
import { generateReferralLink, copyRefLink, getReferrerFromURL, registerReferrer } from './referral.js';
import { buyAndStake, loadStakingInfo, claimStakingReward } from './staking.js';
import { loadReferralInfo, claimReferralReward } from './reward.js';

// expose to window for HTML onClick
window.connectWallet = connectWallet;
window.copyRefLink = copyRefLink;
window.registerReferrer = registerReferrer;
window.buyAndStake = buyAndStake;
window.claimStakingReward = claimStakingReward;
window.claimReferralReward = claimReferralReward;

// refresh all UI pieces
export function updateUI() {
  generateReferralLink();
  loadStakingInfo();
  loadReferralInfo();
}
// make globally accessible to avoid circular import
window.updateUI = updateUI;

window.addEventListener('load', () => {
  getReferrerFromURL();
});
