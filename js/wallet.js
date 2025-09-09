// js/wallet.js
import { contractAddress, usdtAddress, kjcAddress, routerAddress, stakingABI, usdtABI } from '../config.js';
import { getTokenDecimals, getFriendlyErrorMessage } from './utils.js';

// Minimal router ABI (getAmountsOut)
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

// Minimal ERC20 ABI for KJC
const ERC20_ABI_MINIMAL = [
  { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
  { "constant": false, "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" },
  { "constant": true, "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }
];

export async function connectWallet() {
  const $addr = document.getElementById("walletAddress");
  if ($addr) { $addr.innerText = `กำลังเชื่อมต่อ...`; $addr.classList.remove("success", "error"); }

  if (typeof window.ethereum === 'undefined') {
    alert("กรุณาติดตั้ง MetaMask หรือเปิดผ่าน DApp Browser");
    if ($addr) { $addr.innerText = `❌ ไม่พบ Wallet Extension`; $addr.classList.add("error"); }
    return;
  }

  try {
    window.web3 = new Web3(window.ethereum);
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    window.account = accounts[0];

    const expectedChainId = '0x38'; // BSC mainnet
    const currentChainIdHex = window.web3.utils.toHex(await window.web3.eth.getChainId());
    if (currentChainIdHex !== expectedChainId) {
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: expectedChainId }] });
        const newAccounts = await window.web3.eth.getAccounts();
        window.account = newAccounts[0];
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: expectedChainId,
              chainName: 'BNB Smart Chain',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/']
            }]
          });
          const newAccounts = await window.web3.eth.getAccounts();
          window.account = newAccounts[0];
        } else {
          alert("❌ กรุณาสลับไป Binance Smart Chain ด้วยตนเอง");
          if ($addr) { $addr.innerText = `❌ การเชื่อมต่อล้มเหลว`; $addr.classList.add("error"); }
          return;
        }
      }
    }

    if ($addr) {
      $addr.innerText = `✅ ${window.account.substring(0, 6)}...${window.account.substring(window.account.length - 4)}`;
      $addr.classList.add("success");
    }

    // init contracts
    window.stakingContract = new window.web3.eth.Contract(stakingABI, contractAddress);
    window.routerContract  = new window.web3.eth.Contract(ROUTER_ABI_MINIMAL, routerAddress);
    window.usdtContract    = new window.web3.eth.Contract(usdtABI, usdtAddress);
    window.kjcContract     = new window.web3.eth.Contract(ERC20_ABI_MINIMAL, kjcAddress);

    // decimals
    window.usdtDecimals = await getTokenDecimals(window.usdtContract, 18);
    window.kjcDecimals  = await getTokenDecimals(window.kjcContract, 18);

    // update UI
    window.updateUI?.();

    // listeners
    if (window.ethereum && window.ethereum.on) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts?.length) { window.account = accounts[0]; location.reload(); }
        else { window.account = null; if ($addr) { $addr.innerText = `❌ ยังไม่เชื่อมต่อกระเป๋า`; $addr.classList.remove("success"); } }
      });
      window.ethereum.on('chainChanged', () => location.reload());
    }

  } catch (e) {
    const msg = getFriendlyErrorMessage(e);
    alert("❌ การเชื่อมต่อล้มเหลว: " + msg);
    if ($addr) { $addr.innerText = `❌ การเชื่อมต่อล้มเหลว`; $addr.classList.add("error"); }
  }
}
