// js/utils.js

// show status under buttons
export function setStatus(id, message, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message ?? '';
  el.className = 'status-message ' + (isError ? 'error' : 'success');
}

// time helper
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const m = Math.ceil(s / 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  let out = '';
  if (h > 0) out += `${h} ชั่วโมง `;
  out += `${mm} นาที`;
  return out.trim();
}

// wei -> token string
export function displayWeiToToken(weiAmount, decimals) {
  try {
    const dec = Number(decimals);
    if (dec < 0 || isNaN(dec)) return '0';
    const bn = BigInt(weiAmount ?? '0');
    if (bn === 0n) return '0';
    const base = 10n ** BigInt(dec);
    const i = bn / base;
    const f = bn % base;
    if (f === 0n) return i.toString();
    const frac = f.toString().padStart(dec, '0').replace(/0+$/, '');
    return `${i.toString()}.${frac}`;
  } catch (e) {
    const dec = Number(decimals) || 18;
    return (Number(weiAmount ?? 0) / 10 ** dec).toString();
  }
}

// token -> wei string
export function tokenToWei(tokenAmount, decimals) {
  try {
    const dec = Number(decimals) || 18;
    const s = String(tokenAmount ?? '').replace(/,/g, '').trim();
    if (!s || isNaN(Number(s))) return '0';
    const [intPart, fracRaw = ''] = s.split('.');
    const frac = (fracRaw + '0'.repeat(dec)).slice(0, dec);
    const i = BigInt(intPart || '0') * (10n ** BigInt(dec));
    const f = BigInt(frac || '0');
    return (i + f).toString();
  } catch (e) {
    try { return window.web3?.utils?.toWei(String(tokenAmount), 'ether'); } catch { return '0'; }
  }
}

// human error
export function getFriendlyErrorMessage(error) {
  const raw =
    error?.data?.message ||
    error?.error?.message ||
    error?.message ||
    (typeof error === 'string' ? error : '');
  const msg = (raw || '').toLowerCase();

  if (msg.includes('user rejected') || msg.includes('user denied')) return 'ผู้ใช้ยกเลิกธุรกรรม';
  if (msg.includes('insufficient funds')) return 'ยอดเงินในกระเป๋าไม่พอ (ค่าน้ำมัน/โทเค็น)';
  if (msg.includes('replacement transaction underpriced') || msg.includes('nonce too low')) return 'ธุรกรรมชนกันหรือ nonce ต่ำ';
  if (msg.includes('intrinsic gas too low') || msg.includes('out of gas') || msg.includes('gas required exceeds')) return 'Gas ไม่พอ';
  if (msg.includes('transfer amount exceeds balance')) return 'ยอดโทเค็นไม่พอ';
  if (msg.includes('execution reverted')) return 'ธุรกรรมถูกยกเลิก (ไม่ผ่านเงื่อนไขในสัญญา)';
  return raw || 'ไม่ทราบสาเหตุ';
}

// read decimals
export async function getTokenDecimals(tokenContract, fallback = 18) {
  try {
    const decimals = await tokenContract.methods.decimals().call();
    return parseInt(decimals);
  } catch {
    return fallback;
  }
}
