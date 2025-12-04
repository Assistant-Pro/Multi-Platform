const SERVER_BASE = 'https://cb-cxpf.onrender.com';
const buyButtons = document.querySelectorAll('.buyBtn');

// получить блок сообщения рядом с кнопкой
function getMessageBox(btn) {
  // ищем .buy-message внутри того же родителя
  return btn.parentElement.querySelector('.buy-message');
}

buyButtons.forEach(btn => {
  btn.addEventListener('click', async () => {
    const product = btn.dataset.product;
    if (!product) return;

    const messageBox = getMessageBox(btn);
    if (messageBox) messageBox.innerHTML = 'Processing...';

    let checkoutWindow = window.open('', '_blank'); // открываем пустую вкладку сразу

    try {
      const res = await fetch(`${SERVER_BASE}/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product })
      });

      const data = await res.json();

      if (!res.ok || !data.checkoutUrl || !data.orderId) {
        if (messageBox) messageBox.textContent = data?.error || 'Failed to create checkout.';
        checkoutWindow.close();
        return;
      }

      const { checkoutUrl, orderId } = data;
      checkoutWindow.location.href = checkoutUrl;

      if (messageBox) {
        messageBox.innerHTML = `
          <div>Checkout opened. Complete the payment.</div>
          <div style="color:#FF3697; font-size:0.9rem;">
            Keep this page open — your download link will appear here after payment.
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
                  One-time link, expires in 1 hour.
                </div>
              `;
            }
          }
        } catch (e) {
          console.error('Download polling error', e);
        }
      }, 4000);

      setTimeout(() => clearInterval(interval), 20 * 60 * 1000);

    } catch (err) {
      console.error('Create checkout error', err);
      if (messageBox) messageBox.textContent = 'Server error. Try again later.';
      checkoutWindow.close();
    }
  });
});
