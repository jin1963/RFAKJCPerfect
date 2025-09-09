// js/reward.js
import { displayWeiToToken, getFriendlyErrorMessage } from './utils.js';

export async function loadReferralInfo() {
  if (!window.stakingContract || !window.account || typeof window.kjcDecimals === 'undefined') {
    document.getElementById("yourReferralReward").innerText = "⚠️ กำลังโหลดข้อมูล...";
    return;
  }

  try {
    const rawReferralAmount = await window.stakingContract.methods.referralReward(window.account).call();
    const displayReferral = displayWeiToToken(rawReferralAmount, window.kjcDecimals);
    document.getElementById("yourReferralReward").innerText =
      `👥 Claimable Referral Reward: ${displayReferral} KJC`;
  } catch (e) {
    document.getElementById("yourReferralReward").innerText =
      "❌ โหลดค่าแนะนำไม่สำเร็จ";
    document.getElementById("yourReferralReward").classList.add("error");
  }
}

export async function claimReferralReward() {
  if (!window.stakingContract || !window.account) {
    document.getElementById("referralClaimStatus").innerText = "⚠️ กรุณาเชื่อมกระเป๋าก่อน";
    return;
  }

  const $s = document.getElementById("referralClaimStatus");
  $s.innerText = "กำลังดำเนินการเคลมรางวัลค่าแนะนำ...";
  $s.classList.remove("error", "success");

  try {
    const rawClaimable = await window.stakingContract.methods.referralReward(window.account).call();
    if (BigInt(rawClaimable) === 0n) {
      alert("✅ ไม่มีรางวัลค่าแนะนำให้เคลม");
      $s.innerText = "ไม่มีรางวัลค่าแนะนำ";
      $s.classList.add("success");
      return;
    }

    const tx = await window.stakingContract.methods.claimReferralReward().send({ from: window.account });
    const receipt = await window.web3.eth.getTransactionReceipt(tx.transactionHash);

    if (receipt && receipt.status) {
      alert("🎉 เคลมรางวัลค่าแนะนำสำเร็จแล้ว!");
      $s.innerText = "🎉 เคลมรางวัลค่าแนะนำสำเร็จแล้ว!";
      $s.classList.add("success");
      window.updateUI?.();
    } else {
      alert("❌ การเคลมรางวัลค่าแนะนำไม่สำเร็จ หรือธุรกรรมถูกปฏิเสธ");
      $s.innerText = "❌ การเคลมล้มเหลว!";
      $s.classList.add("error");
    }
  } catch (e) {
    const msg = getFriendlyErrorMessage(e);
    $s.innerText = `❌ เกิดข้อผิดพลาด: ${msg}`;
    $s.classList.add("error");
    alert(`❌ เกิดข้อผิดพลาดในการเคลมรางวัล: ${msg}`);
  }
}
