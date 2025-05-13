console.log("Trading Terminal loaded");

// Получаем кнопки и блок для сообщений
const buttons = document.querySelectorAll('.buyBtn');
const messageDiv = document.getElementById('message');

buttons.forEach(button => {
  button.addEventListener('click', async () => {
    const product = button.getAttribute('data-product');
    messageDiv.textContent = 'Creating checkout...';

    try {
      // Создаём checkout на сервере
      const res = await fetch('/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product })
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        // Открываем окно оплаты Coinbase
        const win = window.open(data.checkoutUrl, '_blank');
        messageDiv.textContent = 'Checkout opened. Complete the payment.';

        // Проверяем каждые 3 секунды, доступен ли файл
        const checkDownload = setInterval(async () => {
          try {
            const dlRes = await fetch(`/download/${product}`);
            const dlData = await dlRes.json();

            // Если сервер вернул файл
            if (dlData.file) {
              messageDiv.innerHTML = `Payment confirmed! Download your file: <a href="${dlData.file}" target="_blank">${dlData.file}</a>`;
              clearInterval(checkDownload);

              // Закрываем окно оплаты автоматически, если ещё открыто
              if (win && !win.closed) win.close();
            }
          } catch (err) {
            console.error('Error checking download:', err);
          }
        }, 3000);

      } else {
        messageDiv.textContent = 'Failed to create checkout.';
        console.error(data);
      }
    } catch (err) {
      console.error('Error creating checkout:', err);
      messageDiv.textContent = 'Error creating checkout.';
    }
  });
});
