import { contractAddress, usdtAddress, kjcAddress, routerAddress, stakingABI, usdtABI } from '../config.js';
import { getTokenDecimals, getFriendlyErrorMessage } from './utils.js';
import { updateUI } from './app.js';
import { autoSetReferrerFromURL } from './referral.js'; // ✅ นำเข้า

const ROUTER_ABI_MINIMAL = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
      { "internalType": "address[]", "name": "path", "type": "address[]" }
    ],
    "name": "getAmountsOut",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  }
];

const ERC20_ABI_MINIMAL = [
  { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "constant": false, "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
  { "constant": true, "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

export async function connectWallet() {
  document.getElementById("walletAddress").innerText = `กำลังเชื่อมต่อ...`;
  document.getElementById("walletAddress").classList.remove("success", "error");

  if (typeof window.ethereum === 'undefined') {
    alert("กรุณาติดตั้ง MetaMask หรือ Bitget Wallet หรือเปิด DApp ผ่าน Browser ใน Wallet App");
    document.getElementById("walletAddress").innerText = `❌ ไม่พบ Wallet Extension`;
    document.getElementById("walletAddress").classList.add("error");
    return;
  }

  try {
    window.web3 = new Web3(window.ethereum);
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    window.account = accounts[0];

    const currentChainId = await window.web3.eth.getChainId();
    if (window.web3.utils.toHex(currentChainId) !== '0x38') {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }],
      });
    }

    document.getElementById("walletAddress").innerText = `✅ ${window.account.substring(0, 6)}...${window.account.substring(window.account.length - 4)}`;
    document.getElementById("walletAddress").classList.add("success");

    window.stakingContract = new window.web3.eth.Contract(stakingABI, contractAddress);
    window.routerContract = new window.web3.eth.Contract(ROUTER_ABI_MINIMAL, routerAddress);
    window.usdtContract = new window.web3.eth.Contract(usdtABI, usdtAddress);
    window.kjcContract = new window.web3.eth.Contract(ERC20_ABI_MINIMAL, kjcAddress);

    window.usdtDecimals = await getTokenDecimals(window.usdtContract, 18);
    window.kjcDecimals = await getTokenDecimals(window.kjcContract, 18);

    updateUI();

    // ✅ เรียกสมัคร Referrer อัตโนมัติ
    await autoSetReferrerFromURL();

  } catch (e) {
    const errorMessage = getFriendlyErrorMessage(e);
    alert("❌ การเชื่อมต่อล้มเหลว: " + errorMessage);
    document.getElementById("walletAddress").innerText = `❌ การเชื่อมต่อล้มเหลว`;
    document.getElementById("walletAddress").classList.add("error");
  }
}
