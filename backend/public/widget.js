(function() {
  const scriptTag = document.currentScript;
  if (!scriptTag) {
    console.error('Widget script must be loaded synchronously or have document.currentScript support.');
    return;
  }
  const clientId = scriptTag.getAttribute('data-client-id');
  if (!clientId) {
    console.error('Missing data-client-id on widget script.');
    return;
  }

  // Identify backend URL dynamically based on where the script is hosted if possible, 
  // otherwise fallback to localhost for local testing.
  const backendUrl = new URL(scriptTag.src).origin;

  let config = null;
  let isOpen = false;

  async function initWidget() {
    try {
      const res = await fetch(`${backendUrl}/api/widgets/public/${clientId}`);
      if (!res.ok) {
          console.warn('Widget is inactive or not configured.');
          return;
      }
      config = await res.json();

      if (config.status === 'INACTIVE') return;

      injectStyles();
      renderUI();
    } catch (err) {
      console.error('Error initializing chat widget:', err);
    }
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      #wa-crm-widget-btn {
        position: fixed;
        bottom: 20px;
        ${config.position === 'left' ? 'left: 20px;' : 'right: 20px;'}
        width: 60px;
        height: 60px;
        background-color: ${config.theme_color};
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        cursor: pointer;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;
      }
      #wa-crm-widget-btn:hover {
        transform: scale(1.05);
      }
      #wa-crm-widget-btn svg {
        fill: white;
        width: 32px;
        height: 32px;
      }
      #wa-crm-widget-popup {
        position: fixed;
        bottom: 90px;
        ${config.position === 'left' ? 'left: 20px;' : 'right: 20px;'}
        width: 320px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 999999;
        display: none;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      }
      #wa-crm-widget-popup.open {
        display: flex;
      }
      .wa-crm-header {
        background-color: ${config.theme_color};
        color: white;
        padding: 20px;
      }
      .wa-crm-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      .wa-crm-header p {
        margin: 5px 0 0;
        font-size: 13px;
        opacity: 0.9;
      }
      .wa-crm-body {
        padding: 20px;
      }
      .wa-crm-form-group {
        margin-bottom: 12px;
      }
      .wa-crm-form-group label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 4px;
        color: #4a5568;
      }
      .wa-crm-form-group input, .wa-crm-form-group textarea {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 14px;
        outline: none;
      }
      .wa-crm-form-group input:focus, .wa-crm-form-group textarea:focus {
        border-color: ${config.theme_color};
      }
      .wa-crm-submit {
        width: 100%;
        background-color: ${config.theme_color};
        color: white;
        border: none;
        padding: 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .wa-crm-submit:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
      .wa-crm-submit:hover {
        opacity: 0.9;
      }
      .wa-crm-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 20px;
        line-height: 1;
      }
      .wa-crm-success {
        text-align: center;
        padding: 20px;
        display: none;
      }
      .wa-crm-success.visible {
        display: block;
      }
    `;
    document.head.appendChild(style);
  }

  function renderUI() {
    const btn = document.createElement('div');
    btn.id = 'wa-crm-widget-btn';
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
    btn.onclick = togglePopup;
    document.body.appendChild(btn);

    const popup = document.createElement('div');
    popup.id = 'wa-crm-widget-popup';
    popup.innerHTML = `
      <div class="wa-crm-header">
        <button class="wa-crm-close" id="wa-crm-close">&times;</button>
        <h3>${config.welcome_text}</h3>
        <p>Please provide your details to connect with us.</p>
      </div>
      <div class="wa-crm-body" id="wa-crm-form-container">
        <form id="wa-crm-form">
           <div class="wa-crm-form-group">
              <label>Name</label>
              <input type="text" id="wa-name" required />
           </div>
           <div class="wa-crm-form-group">
              <label>Phone Number</label>
              <input type="tel" id="wa-phone" required />
           </div>
           <div class="wa-crm-form-group">
              <label>Email (Optional)</label>
              <input type="email" id="wa-email" />
           </div>
           <div class="wa-crm-form-group">
              <label>Message</label>
              <textarea id="wa-message" rows="3"></textarea>
           </div>
           <button type="submit" class="wa-crm-submit" id="wa-submit-btn">${config.button_text}</button>
        </form>
      </div>
      <div class="wa-crm-success" id="wa-crm-success">
        <svg style="width:48px;height:48px;fill:${config.theme_color};margin-bottom:10px;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        <h3 style="margin:0;font-size:18px;color:#333;">Redirecting to WhatsApp...</h3>
        <p style="font-size:14px;color:#666;">If nothing happens, <a href="#" id="wa-crm-fallback-link" target="_blank" style="color:${config.theme_color};text-decoration:none;font-weight:bold;">click here</a>.</p>
      </div>
    `;
    document.body.appendChild(popup);

    document.getElementById('wa-crm-close').onclick = togglePopup;
    document.getElementById('wa-crm-form').onsubmit = submitLead;
  }

  function togglePopup() {
    const popup = document.getElementById('wa-crm-widget-popup');
    isOpen = !isOpen;
    if (isOpen) {
       popup.classList.add('open');
       document.getElementById('wa-name').focus();
    } else {
       popup.classList.remove('open');
    }
  }

  async function submitLead(e) {
    e.preventDefault();
    const btn = document.getElementById('wa-submit-btn');
    btn.disabled = true;
    btn.innerText = 'Connecting...';

    const name = document.getElementById('wa-name').value;
    const phone = document.getElementById('wa-phone').value;
    const email = document.getElementById('wa-email').value;
    const message = document.getElementById('wa-message').value;

    try {
      const res = await fetch(`${backendUrl}/api/widgets/public/${clientId}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, message })
      });

      const data = await res.json();

      if (res.ok && data.redirectUrl) {
         document.getElementById('wa-crm-form-container').style.display = 'none';
         document.getElementById('wa-crm-success').classList.add('visible');
         document.getElementById('wa-crm-fallback-link').href = data.redirectUrl;
         setTimeout(() => {
            window.open(data.redirectUrl, '_blank');
            togglePopup(); // close the widget after opening whatsapp
         }, 1500);
      } else if (res.ok) {
         // No redirect configured, just show thanks
         document.getElementById('wa-crm-form-container').style.display = 'none';
         document.getElementById('wa-crm-success').classList.add('visible');
         document.getElementById('wa-crm-success').innerHTML = `
            <svg style="width:48px;height:48px;fill:${config.theme_color};margin-bottom:10px;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            <h3 style="margin:0;font-size:18px;color:#333;">Thank You!</h3>
            <p style="font-size:14px;color:#666;">We have received your message and will get right back to you.</p>
         `;
         setTimeout(togglePopup, 3000);
      } else {
         alert('Something went wrong. Please try again.');
         btn.disabled = false;
         btn.innerText = config.button_text;
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
      btn.disabled = false;
      btn.innerText = config.button_text;
    }
  }

  // Startup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
