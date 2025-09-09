// js/staking.js
import { tokenToWei, displayWeiToToken, getFriendlyErrorMessage } from './utils.js';
import { usdtAddress, kjcAddress, contractAddress } from '../config.js';

// ใช้ window.updateUI?.() เพื่อเลี่ยง circular import

export async function buyAndStake() {
  if (
    !window.stakingContract || !window.account || !window.usdtContract || !window.routerContract ||
    typeof window.usdtDecimals === 'undefined' || typeof window.kjcDecimals === 'undefined'
  ) {
    alert("⚠️ กำลังโหลดข้อมูล กรุณารอสักครู่แล้วลองใหม่");
    return;
  }

  const rawInput = document.getElementById("usdtAmount").value.trim();
  if (!rawInput || isNaN(rawInput) || parseFloat(rawInput) <= 0) {
    alert("❌ กรุณาใส่จำนวน USDT ที่ถูกต้อง (> 0)");
    return;
  }

  const usdtAmountFloat = parseFloat(rawInput);
  const usdtInWei = tokenToWei(usdtAmountFloat, window.usdtDecimals);

  const $status = document.getElementById("buyTokenStatus");
  $status.innerText = "กำลังประเมินราคา KJC…";
  $status.classList.remove("error", "success");

  try {
    if (!window.web3.utils.isAddress(usdtAddress) || !window.web3.utils.isAddress(kjcAddress)) {
      $status.innerText = "❌ ที่อยู่โทเคนไม่ถูกต้องใน config.js";
      $status.classList.add("error");
      alert("❌ ที่อยู่ Token ไม่ถูกต้องใน config.js");
      return;
    }

    const path = [usdtAddress, kjcAddress];
    const amountsOut = await window.routerContract.methods.getAmountsOut(usdtInWei, path).call();
    const expectedKjcOutWei = BigInt(amountsOut[1]);
    const minOut = expectedKjcOutWei * 95n / 100n; // slippage 5%

    const allowance = await window.usdtContract.methods.allowance(window.account, contractAddress).call();
    if (BigInt(allowance) < BigInt(usdtInWei)) {
      $status.innerText = "กำลังขออนุมัติ USDT…";
      await window.usdtContract.methods.approve(contractAddress, usdtInWei).send({ from: window.account });
      $status.innerText = "✅ อนุมัติสำเร็จ! กรุณากด “ซื้อและ Stake” อีกครั้ง";
      $status.classList.add("success");
      alert("✅ อนุมัติ USDT สำเร็จแล้ว! กดปุ่มอีกครั้งเพื่อทำรายการซื้อและ Stake");
      return;
    }

    $status.innerText = "กำลังส่งธุรกรรมซื้อและ Stake…";
    const buyTx = await window.stakingContract.methods
      .buyAndStake(usdtInWei, minOut.toString())
      .send({ from: window.account });

    $status.innerText = "กำลังรอการยืนยันธุรกรรม…";
    const receipt = await window.web3.eth.getTransactionReceipt(buyTx.transactionHash);

    if (receipt && receipt.status) {
      const amt = usdtAmountFloat.toLocaleString();
      $status.innerText = `✅ ซื้อ ${amt} USDT → KJC และ Stake สำเร็จ!`;
      $status.classList.add("success");
      alert(`✅ ซื้อ ${amt} USDT และ Stake สำเร็จ!`);
      window.updateUI?.();
    } else {
      $status.innerText = "❌ การซื้อไม่สำเร็จ หรือธุรกรรมถูกปฏิเสธ";
      $status.classList.add("error");
      alert("❌ การซื้อไม่สำเร็จ หรือธุรกรรมถูกปฏิเสธ");
    }

  } catch (e) {
    const msg = getFriendlyErrorMessage(e);
    $status.innerText = `❌ ข้อผิดพลาด: ${msg}`;
    $status.classList.add("error");
    alert(`❌ เกิดข้อผิดพลาดในการซื้อเหรียญ: ${msg}`);
  }
}

export async function loadStakingInfo() {
  const stakeEl = document.getElementById("yourStake");
  const rewEl   = document.getElementById("yourStakingReward");

  if (!window.stakingContract || !window.account || typeof window.kjcDecimals === 'undefined') {
    if (stakeEl) stakeEl.innerText = "⚠️ กำลังโหลดข้อมูล...";
    if (rewEl)   rewEl.innerText   = "⚠️ กำลังโหลดข้อมูล...";
    return;
  }

  try {
    const rawStakedAmount = await window.stakingContract.methods.stakedAmount(window.account).call();
    const stakingReward   = await window.stakingContract.methods.getClaimable(window.account).call();

    const stakeDisplay = displayWeiToToken(rawStakedAmount, window.kjcDecimals);
    const rewardDisplay = displayWeiToToken(stakingReward, window.kjcDecimals);

    if (stakeEl) stakeEl.innerText = `💰 Your Stake: ${stakeDisplay} KJC`;
    if (rewEl)   rewEl.innerText   = `🎉 Claimable Stake Reward: ${rewardDisplay} KJC`;
  } catch (e) {
    if (stakeEl) { stakeEl.innerText = "❌ โหลดไม่สำเร็จ"; stakeEl.classList.add("error"); }
    if (rewEl)   { rewEl.innerText   = "❌ โหลดไม่สำเร็จ"; rewEl.classList.add("error"); }
  }
}

export async function claimStakingReward() {
  const $status = document.getElementById("claimStakeStatus");
  if (!window.stakingContract || !window.account) {
    if ($status) $status.innerText = "⚠️ กรุณาเชื่อมกระเป๋าก่อน";
    return;
  }

  $status.innerText = "กำลังตรวจสอบรอบเคลม…";
  $status.classList.remove("error", "success");

  try {
    const lastClaimTime = await window.stakingContract.methods.lastClaim(window.account).call();
    const claimInterval = await window.stakingContract.methods.CLAIM_INTERVAL().call();
    const now = Math.floor(Date.now() / 1000);
    const nextClaimTime = Number(lastClaimTime) + Number(claimInterval);

    if (now >= nextClaimTime) {
      $status.innerText = "กำลังเคลมรางวัล…";
      const tx = await window.stakingContract.methods.claimStakingReward().send({ from: window.account });
      const receipt = await window.web3.eth.getTransactionReceipt(tx.transactionHash);

      if (receipt && receipt.status) {
        $status.innerText = "🎉 เคลมรางวัล Stake สำเร็จแล้ว!";
        $status.classList.add("success");
        alert("🎉 เคลมรางวัล Stake สำเร็จแล้ว!");
        window.updateUI?.();
      } else {
        $status.innerText = "❌ การเคลมล้มเหลว";
        $status.classList.add("error");
        alert("❌ การเคลมไม่สำเร็จ");
      }
    } else {
      const remainingSeconds = nextClaimTime - now;
      const mins = Math.ceil(remainingSeconds / 60);
      const hrs  = Math.floor(mins / 60);
      const mm   = mins % 60;
      const waitString = (hrs > 0 ? `${hrs} ชั่วโมง ` : "") + `${mm} นาที`;
      $status.innerText = `⏳ ต้องรออีก ${waitString}`;
    }
  } catch (e) {
    const msg = getFriendlyErrorMessage(e);
    $status.innerText = `❌ เกิดข้อผิดพลาด: ${msg}`;
    $status.classList.add("error");
    alert(`❌ เกิดข้อผิดพลาดในการเคลมรางวัล: ${msg}`);
  }
}
