// public/buy.js
const SERVER_BASE = 'https://cb-cxpf.onrender.com';

const buyButtons = document.querySelectorAll('.buyBtn');

// получаем message-блок рядом с кнопкой
function getMessageBox(btn) {
  return btn.parentElement.querySelector('.buy-message');
}

buyButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const product = btn.dataset.product;
    if (!product) return;

    const messageBox = getMessageBox(btn);
    if (messageBox) messageBox.innerHTML = '';

    try {
      const res = await fetch(`${SERVER_BASE}/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product })
      });

      const data = await res.json();

      if (!res.ok) {
        if (messageBox) {
          messageBox.textContent = data?.error || 'Failed to create checkout. Try again.';
        }
        return;
      }

      const { checkoutUrl, orderId } = data;

      if (!checkoutUrl || !orderId) {
        if (messageBox) {
          messageBox.textContent = 'Failed to create checkout. Try again.';
        }
        return;
      }

      window.open(checkoutUrl, '_blank');

      if (messageBox) {
        messageBox.innerHTML = `
          <div>Checkout opened. Complete the payment.</div>
          <div style="color:#FF3697; font-size:0.9rem;">
            Please keep this page open — your download link will appear here once payment is confirmed.
          </div>
          <div class="downloadArea" style="margin-top:10px;color:#ccc;">
            Waiting for confirmation...
          </div>
        `;
      }

      const downloadArea = messageBox.querySelector('.downloadArea');

      const interval = setInterval(async () => {
        try {
          const dl = await fetch(`${SERVER_BASE}/download/${encodeURIComponent(orderId)}`);
          const dlData = await dl.json();

          if (dlData?.redeemUrl) {
            clearInterval(interval);

            if (downloadArea) {
              downloadArea.innerHTML = `
                ✅ Payment confirmed!<br>
                <a href="${dlData.redeemUrl}" target="_blank" style="color:lime;">
                  Download your product
                </a>
                <div style="font-size:0.85rem;color:#ddd;margin-top:6px;">
                  This link is one-time and expires in 1 hour.
                </div>
              `;
            }
          }
        } catch (e) {
          console.error('download poll error', e);
        }
      }, 4000);

      setTimeout(() => clearInterval(interval), 20 * 60 * 1000);

    } catch (err) {
      console.error('create-checkout error', err);
      if (messageBox) {
        messageBox.textContent = 'Server error. Try again later.';
      }
    }
  });
});
