import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const config = window.HEACKERSHUB_SUPABASE || {};
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');

function showStatus(message, type) {
  if (!status) return;
  status.textContent = message;
  status.className = `form-status ${type}`;
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    if (String(data.get('website') || '').trim()) return;

    let isValidUrl = false;
    try {
      isValidUrl = new URL(config.url).protocol === 'https:';
    } catch {
      isValidUrl = false;
    }

    const hasKeyUrl = typeof config.anonKey === 'string' && /^https?:\/\//i.test(config.anonKey);
    if (!isValidUrl || !config.anonKey || hasKeyUrl) {
      showStatus('Supabase config error: anonKey me Supabase ka public anon/publishable key paste karein, Project URL nahi.', 'error');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) return;

    submitButton.disabled = true;
    submitButton.textContent = 'Sending securely...';
    showStatus('', '');

    const supabase = createClient(config.url, config.anonKey);
    const { data: result, error } = await supabase.functions.invoke('submit-lead', {
      body: {
      name: String(data.get('Name') || '').trim(),
      email: String(data.get('Email') || '').trim(),
      project_type: String(data.get('Project Type') || '').trim(),
      message: String(data.get('Message') || '').trim()
      }
    });

    submitButton.disabled = false;
    submitButton.textContent = 'Send Proposal Request';

    if (error) {
      console.error('Supabase lead submission failed:', error);
      showStatus(`Request error: ${error.message || 'Request rejected'}`, 'error');
      return;
    }

    if (!result || result.success !== true) {
      showStatus('Request received, but notification setup needs attention. Please email hackershub.company@gmail.com.', 'error');
      return;
    }

    form.reset();
    showStatus('Request received. Our team will contact you within one business day.', 'success');
  });
}
