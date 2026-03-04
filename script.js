const questData = [
  {
    id: 'dvp-quorum-vote',
    section: 'Proposal Vote',
    title: 'DVP Quorum & Proposal Cancellation Vote is live on Tally',
    points: [
      'A bundled proposal introduces updates to quorum computation and allows proposal cancellation during the 3-day pre-voting window.',
      'Voting began Thursday and closes on March 12.',
      'Current stats: ✅ 56.55m ARB | ❌ 336k ARB.',
      'Quorum requirement: 218.85m ARB.'
    ],
    link: 'https://www.tally.xyz/gov/arbitrum',
    linkLabel: 'Open the Tally vote'
  },
  {
    id: 'funds-consolidation-forum',
    section: 'Forum Discussion',
    title: 'Automate consolidation of idle funds into the Treasury Management portfolio',
    points: [
      'Entropy Advisors proposes an operating directive to automatically move non-ARB idle funds from DAO initiatives into the ATMC.',
      'DDA V2 and the Arbitrum D.A.O. Grant Program currently hold sizable funds that could be yield-bearing under ATMC.',
      'If approved, funds are moved to AF-chosen and operated wallets when feasible, with each ATMC deployment still requiring OAT approval.',
      'Proposal is expected to move to a temperature check this week.'
    ],
    link: 'https://forum.arbitrum.foundation/',
    linkLabel: 'Read the forum thread'
  },
  {
    id: 'governance-call',
    section: 'Governance Pulse',
    title: 'Open Discussion of Proposals governance call happens tomorrow',
    points: ['Join to hear live context and questions around active governance items.'],
    link: 'https://forum.arbitrum.foundation/',
    linkLabel: 'Find call details'
  },
  {
    id: 'program-updates',
    section: 'Program Updates',
    title: 'Firestarters Grant + RAD posted February updates',
    points: [
      'Firestarters Grant published its monthly update.',
      'Rewarding Active Delegates (RAD) also posted a February progress update.'
    ],
    link: 'https://forum.arbitrum.foundation/',
    linkLabel: 'Browse monthly updates'
  },
  {
    id: 'timeboost-price-reset',
    section: 'Protocol Update',
    title: 'Offchain Labs resets Timeboost reserve price to 0.001 ETH',
    points: [
      'The reserve price was increased from 0.001 ETH to 0.0075 ETH last week.',
      'This week, Offchain Labs reverted that change back to 0.001 ETH.'
    ],
    link: 'https://forum.arbitrum.foundation/',
    linkLabel: 'Read the Timeboost update'
  },
  {
    id: 'grantee-reports',
    section: 'Grantee Reports',
    title: 'Latest grantee reports: local testing support + ChainCraft',
    points: [
      'Arbitrum Native Precompile & Tx-Type support shared a maintenance update for local testing.',
      'ChainCraft shared an update on AI-powered game creation.'
    ],
    link: 'https://forum.arbitrum.foundation/',
    linkLabel: 'Open grantee reports'
  }
];

const questList = document.getElementById('quest-list');
const questTemplate = document.getElementById('quest-template');
const completedCount = document.getElementById('completed-count');
const totalCount = document.getElementById('total-count');
const progressFill = document.getElementById('progress-fill');
const progressbar = document.getElementById('progressbar');
const connectWalletButton = document.getElementById('connect-wallet') ?? document.querySelector('.wallet-button');
const walletStatus = document.getElementById('wallet-status');

const readState = new Set();
const buttonRegistry = new Map();

let activeWallet = '';
let supabaseClient = null;

if (totalCount) {
  totalCount.textContent = String(questData.length);
}

function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function setWalletStatus(message, tone = 'warn') {
  if (!walletStatus) {
    return;
  }

  walletStatus.classList.remove('ok', 'warn', 'danger');
  walletStatus.classList.add(tone);
  walletStatus.textContent = message;
}

function createSupabaseClient() {
  const config = window.APP_CONFIG ?? {};
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    setWalletStatus(
      'Connected wallet, but Supabase is not configured. Set localStorage supabase_url + supabase_anon_key for sync.',
      'warn'
    );
    return null;
  }

  return window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
}

async function persistRead(questId) {
  if (!supabaseClient || !activeWallet) {
    return;
  }

  const payload = {
    wallet_address: activeWallet.toLowerCase(),
    quest_id: questId,
    read_at: new Date().toISOString()
  };

  const { error } = await supabaseClient.from('quest_reads').upsert(payload, {
    onConflict: 'wallet_address,quest_id'
  });

  if (error) {
    setWalletStatus(`Failed to sync progress: ${error.message}`, 'danger');
  }
}

function setReadVisualState(questId) {
  const ui = buttonRegistry.get(questId);
  if (!ui) {
    return;
  }

  ui.card.classList.add('is-read');
  ui.button.textContent = 'Marked as read ✓';
  ui.button.disabled = true;
}

function resetAllReadVisuals() {
  buttonRegistry.forEach(({ card, button }) => {
    card.classList.remove('is-read');
    button.textContent = 'Mark as read';
    button.disabled = false;
  });
}

async function loadProgressFromSupabase() {
  if (!supabaseClient || !activeWallet) {
    return;
  }

  const { data, error } = await supabaseClient
    .from('quest_reads')
    .select('quest_id')
    .eq('wallet_address', activeWallet.toLowerCase());

  if (error) {
    setWalletStatus(`Connected ${shortAddress(activeWallet)}. Could not load saved progress.`, 'danger');
    return;
  }

  readState.clear();
  resetAllReadVisuals();
  data.forEach((row) => {
    readState.add(row.quest_id);
    setReadVisualState(row.quest_id);
  });
  syncProgress();
}

function renderQuests() {
  questData.forEach((quest) => {
    const clone = questTemplate.content.cloneNode(true);
    const card = clone.querySelector('.quest-card');
    const toggle = clone.querySelector('.quest-toggle');
    const content = clone.querySelector('.quest-content');
    const kicker = clone.querySelector('.quest-kicker');
    const title = clone.querySelector('.quest-title');
    const points = clone.querySelector('.quest-points');
    const link = clone.querySelector('.quest-link');
    const readButton = clone.querySelector('.read-button');

    kicker.textContent = quest.section;
    title.textContent = quest.title;

    quest.points.forEach((point) => {
      const li = document.createElement('li');
      li.textContent = point;
      points.append(li);
    });

    link.href = quest.link;
    link.textContent = quest.linkLabel;

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      content.hidden = expanded;
    });

    readButton.addEventListener('click', async () => {
      if (readState.has(quest.id)) {
        return;
      }

      readState.add(quest.id);
      setReadVisualState(quest.id);
      syncProgress();
      await persistRead(quest.id);
    });

    buttonRegistry.set(quest.id, { card, button: readButton });
    questList.append(clone);
  });
}

function syncProgress() {
  const completed = readState.size;
  const total = questData.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  if (completedCount) {
    completedCount.textContent = String(completed);
  }
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }
  if (progressbar) {
    progressbar.setAttribute('aria-valuenow', String(progress));
  }
}

async function connectWallet() {
  if (!window.ethereum) {
    setWalletStatus('No injected wallet found. Install MetaMask or use a Web3-enabled browser.', 'danger');
    return;
  }

  connectWalletButton.disabled = true;

  try {
    const provider = new window.ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const walletAddress = await signer.getAddress();
    const signMessage = `Arbitrum DAO Quest login\nAddress: ${walletAddress}\nNonce: ${Date.now()}`;

    await signer.signMessage(signMessage);

    activeWallet = walletAddress;
    connectWalletButton.textContent = shortAddress(walletAddress);

    supabaseClient = createSupabaseClient();
    await loadProgressFromSupabase();

    if (supabaseClient) {
      setWalletStatus(`Connected ${shortAddress(walletAddress)}. Progress sync is active.`, 'ok');
    }
  } catch (error) {
    connectWalletButton.disabled = false;
    setWalletStatus(`Wallet connection failed: ${error.message}`, 'danger');
  }
}

if (connectWalletButton) {
  connectWalletButton.addEventListener('click', connectWallet);
}

if (questList && questTemplate) {
  renderQuests();
  syncProgress();
}
