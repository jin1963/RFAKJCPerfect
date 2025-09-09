// js/referral.js
import { getFriendlyErrorMessage } from './utils.js';

// generate referral link
export function generateReferralLink() {
  const el = document.getElementById('refLink');
  if (!window.account) {
    if (el) el.value = 'โปรดเชื่อมต่อกระเป๋าเพื่อสร้างลิงก์';
    return;
  }
  const link = `${window.location.origin}${window.location.pathname}?ref=${window.account}`;
  if (el) el.value = link;
}

// copy link
export async function copyRefLink() {
  const input = document.getElementById('refLink');
  if (!input || !input.value) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(input.value);
    } else {
      input.select(); input.setSelectionRange(0, 99999); document.execCommand('copy');
    }
    alert('✅ คัดลอกลิงก์เรียบร้อยแล้ว!');
  } catch {
    alert('❌ คัดลอกลิงก์ไม่สำเร็จ');
  }
}

// get ?ref= from URL
export function getReferrerFromURL() {
  const el = document.getElementById('refAddress');
  if (!el) return;
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref && window.web3?.utils?.isAddress(ref)) el.value = ref;
  } catch { /* ignore */ }
}

// register referrer
export async function registerReferrer() {
  const statusEl = document.getElementById('registerStatus');
  const refEl = document.getElementById('refAddress');

  if (!window.stakingContract || !window.account) {
    alert('กรุณาเชื่อมกระเป๋าก่อน');
    return;
  }
  if (!refEl) return;

  const ref = refEl.value.trim();
  if (!window.web3.utils.isAddress(ref)) { alert('❌ Referrer address ไม่ถูกต้อง'); return; }
  if (ref.toLowerCase() === window.account.toLowerCase()) { alert('❌ ห้ามใช้ Address ตัวเอง'); return; }

  // has ref already?
  try {
    const currentRef = await window.stakingContract.methods.referrerOf(window.account).call();
    if (currentRef && currentRef !== '0x0000000000000000000000000000000000000000') {
      if (statusEl) { statusEl.textContent = `ℹ️ บัญชีนี้มีผู้แนะนำอยู่แล้ว: ${currentRef}`; statusEl.classList.remove('error'); statusEl.classList.add('success'); }
      return;
    }
  } catch { /* non-critical */ }

  if (statusEl) { statusEl.textContent = '⏳ กำลังดำเนินการสมัคร Referrer...'; statusEl.classList.remove('error', 'success'); }

  try {
    const receipt = await window.stakingContract.methods.setReferrer(ref).send({ from: window.account });
    if (receipt?.status) {
      if (statusEl) { statusEl.textContent = '✅ สมัคร Referrer สำเร็จแล้ว!'; statusEl.classList.add('success'); }
      window.updateUI?.();
    } else {
      if (statusEl) { statusEl.textContent = '❌ การสมัครไม่สำเร็จ หรือถูกปฏิเสธ'; statusEl.classList.add('error'); }
    }
  } catch (e) {
    const msg = getFriendlyErrorMessage(e);
    if (statusEl) { statusEl.textContent = `❌ เกิดข้อผิดพลาด: ${msg}`; statusEl.classList.add('error'); }
    alert(`❌ สมัคร Referrer ไม่สำเร็จ: ${msg}`);
  }
}
