// public/buy.js
const SERVER_BASE = 'https://cb-cxpf.onrender.com';

const buyButtons = document.querySelectorAll('.buyBtn');
const messageDiv = document.getElementById('message');

if (!messageDiv) {
  console.warn('No #message element found on page — create it to show statuses.');
}

buyButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const product = btn.dataset.product;
    if (!product) return;

    if (messageDiv) messageDiv.innerHTML = '';

    try {
      const res = await fetch(`${SERVER_BASE}/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product })
      });

      const data = await res.json();
      if (!res.ok) {
        if (messageDiv) messageDiv.textContent = data?.error || 'Failed to create checkout. Try again.';
        return;
      }

      const { checkoutUrl, orderId } = data;
      if (!checkoutUrl || !orderId) {
        if (messageDiv) messageDiv.textContent = 'Failed to create checkout. Try again.';
        return;
      }

      window.open(checkoutUrl, '_blank');

      if (messageDiv) {
        messageDiv.innerHTML = `
          <div>Checkout opened. Complete the payment.</div>
          <div style="color:#FF3697; font-size:0.9rem;">
            Please keep this page open — your download link will appear here once payment is confirmed.
          </div>
          <div id="downloadArea" style="margin-top:10px;color:#ccc;">Waiting for confirmation...</div>
        `;
      }

      const downloadArea = document.getElementById('downloadArea');

      const interval = setInterval(async () => {
        try {
          const dl = await fetch(`${SERVER_BASE}/download/${encodeURIComponent(orderId)}`);
          const dlData = await dl.json();

          if (dlData?.redeemUrl) {
            clearInterval(interval);

            if (downloadArea) {
              downloadArea.innerHTML = `
                ✅ Payment confirmed!<br>
                <a id="redeemLink" href="${dlData.redeemUrl}" target="_blank" style="color:lime;">
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
      if (messageDiv) messageDiv.textContent = 'Server error. Try again later.';
    }
  });
});
