const PROXY_URL = "https://gemini-proxy-worker.extprojlc.workers.dev/api/gemini";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'EXPLAIN_PAGE') {
    const payload = {
      title: msg.payload.title,
      url: msg.payload.url,
      text: msg.payload.text,
      options: msg.payload.options || {}
    };

    fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async r => {
        // Check for non-OK status codes (4xx, 5xx) from the Worker
        if (!r.ok) {
          // Attempt to parse the JSON error body from the Worker response
          const errorBody = await r.json().catch(() => ({ error: `Worker returned status ${r.status}` }));
          // Reject the promise to enter the catch block
          throw new Error(errorBody.error || `Worker returned status ${r.status}`);
        }
        return r.json();
      })
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));

    // Keep the channel open for async response
    return true;
  }
});
