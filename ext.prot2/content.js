function getReadableText() {

  const blacklist = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'IMG', 'SVG', 'CANVAS']);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
  let node;
  const chunks = [];
  while ((node = walker.nextNode())) {
    const text = node.nodeValue.trim();
    if (!text) continue;
    
    if (text.length < 20) continue;
    const parentTag = node.parentNode && node.parentNode.tagName;
    if (blacklist.has(parentTag)) continue;
    chunks.push(text.replace(/\s+/g, ' '));
  }
  
  let full = chunks.join('\n\n');
  const maxChars = 50_000; // adjust as needed -> chunk or truncate if longer
  if (full.length > maxChars) full = full.slice(0, maxChars) + "\n\n[TRUNCATED]";
  return {
    title: document.title || '',
    url: location.href,
    text: full
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'GET_PAGE_TEXT') {
    try {
      const data = getReadableText();
      console.log("EXTRACTED PAGE DATA:", data);
      sendResponse({ success: true, data });
    } catch (err) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  }
});
