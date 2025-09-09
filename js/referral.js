import { getFriendlyErrorMessage } from './utils.js';
import { updateUI } from './app.js'; 

// สร้างลิงก์แนะนำ
export function generateReferralLink() {
  if (!window.account) {
    document.getElementById("refLink").value = "โปรดเชื่อมต่อกระเป๋าเพื่อสร้างลิงก์";
    return;
  }
  const link = `${window.location.origin}${window.location.pathname}?ref=${window.account}`;
  document.getElementById("refLink").value = link;
}

// คัดลอกลิงก์
export function copyRefLink() {
  const input = document.getElementById("refLink");
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(input.value);
  alert("✅ คัดลอกลิงก์เรียบร้อยแล้ว!");
}

// ดึง referrer จาก URL → เติมช่อง
export function getReferrerFromURL() {
  if (window.web3 && window.web3.utils) {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref && window.web3.utils.isAddress(ref)) {
      document.getElementById("refAddress").value = ref;
    }
  }
}

// สมัคร Referrer
export async function registerReferrer() {
  if (!window.stakingContract || !window.account) {
    alert("กรุณาเชื่อมต่อกระเป๋าก่อน");
    return;
  }

  const ref = document.getElementById("refAddress").value;
  if (!window.web3.utils.isAddress(ref) || ref.toLowerCase() === window.account.toLowerCase()) {
    alert("❌ Referrer address ไม่ถูกต้อง หรือเป็น Address ของคุณเอง");
    return;
  }

  document.getElementById("registerStatus").innerText = "กำลังดำเนินการสมัคร Referrer...";
  document.getElementById("registerStatus").classList.remove("error", "success");

  try {
    const txResponse = await window.stakingContract.methods.setReferrer(ref).send({ from: window.account });
    console.log("registerReferrer: Tx Hash:", txResponse.transactionHash);

    document.getElementById("registerStatus").innerText = "✅ สมัคร Referrer สำเร็จแล้ว!";
    document.getElementById("registerStatus").classList.add("success");
    updateUI();
  } catch (e) {
    const errorMessage = getFriendlyErrorMessage(e);
    document.getElementById("registerStatus").innerText = `❌ เกิดข้อผิดพลาด: ${errorMessage}`;
    document.getElementById("registerStatus").classList.add("error");
  }
}

// ✅ สมัคร Referrer อัตโนมัติจาก URL
export async function autoSetReferrerFromURL() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');

    if (!ref || !window.web3.utils.isAddress(ref)) return;
    if (!window.stakingContract || !window.account) return;

    // ถ้ามีแล้ว ไม่ต้องสมัครซ้ำ
    const currentRef = await window.stakingContract.methods.referrerOf(window.account).call();
    if (currentRef && currentRef !== "0x0000000000000000000000000000000000000000") return;

    // ส่งธุรกรรมสมัครอัตโนมัติ
    await window.stakingContract.methods.setReferrer(ref).send({ from: window.account });
    document.getElementById("registerStatus").innerText = "✅ สมัคร Referrer อัตโนมัติเรียบร้อย!";
    document.getElementById("registerStatus").classList.add("success");
    updateUI();
  } catch (err) {
    console.warn("autoSetReferrerFromURL error:", err.message);
  }
}
