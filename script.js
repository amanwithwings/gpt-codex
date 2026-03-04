const questData = [
  {
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
    section: 'Governance Pulse',
    title: 'Open Discussion of Proposals governance call happens tomorrow',
    points: ['Join to hear live context and questions around active governance items.'],
    link: 'https://forum.arbitrum.foundation/',
    linkLabel: 'Find call details'
  },
  {
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

const readState = new Set();

totalCount.textContent = String(questData.length);

function renderQuests() {
  questData.forEach((quest, index) => {
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

    readButton.addEventListener('click', () => {
      readState.add(index);
      card.classList.add('is-read');
      readButton.textContent = 'Marked as read ✓';
      readButton.disabled = true;
      syncProgress();
    });

    questList.append(clone);
  });
}

function syncProgress() {
  const completed = readState.size;
  const total = questData.length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  completedCount.textContent = String(completed);
  progressFill.style.width = `${progress}%`;
  progressbar.setAttribute('aria-valuenow', String(progress));
}

renderQuests();
syncProgress();
