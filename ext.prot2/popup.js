const explainBtn = document.getElementById('explainBtn');
const resultDiv = document.getElementById('result');
const statusDiv = document.getElementById('status');
const promptExtra = document.getElementById('promptExtra');

explainBtn.addEventListener('click', async () => {
  resultDiv.textContent = '';
  statusDiv.textContent = 'Extracting page content...';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    resultDiv.textContent = 'No active tab.';
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  } catch (e) {
    // If already injected, that's okay
    // console.warn(e);
  }

  chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_TEXT' }, async (response) => {
    if (!response || !response.success) {
      resultDiv.textContent = 'Failed to extract page text: ' + (response && response.error);
      statusDiv.textContent = '';
      return;
    }
    const pageData = response.data;
    statusDiv.textContent = 'Sending content to explanation service...';

    const basePrompt = `
You are an expert computer science tutor and software engineer. Given the problem from the text extracted from the web page, identify the most relevant data structure used to solve it (no need to: tell the data structure that you identified, explain the problem or the data structure being used), then most importantly, explain its real-world applications in a way that is understandable to both beginners and experienced programmers.
Page title: ${pageData.title}
URL: ${pageData.url}

Instructions:
1) At least 5 real-world applications, clearly explained with examples from everyday life or industry.
2) For each application, briefly connect it back to the data structure’s behavior (e.g., how stack operations, hashing, tree traversal, etc., appear in that scenario).
3) Keep the tone simple, structured, and visually clean using bullet points and headings. Keep the text in response unformatted (so no bold or italics, no underlining).

${promptExtra.value || ''}
-----
Page text starts below:
${pageData.text}
    `.trim();

    chrome.runtime.sendMessage({ type: 'EXPLAIN_PAGE', payload: { ...pageData, text: basePrompt } }, (resp) => {
      statusDiv.textContent = '';
      if (!resp) {
        resultDiv.textContent = 'No response from background.';
        return;
      }
      if (!resp.success) {
        resultDiv.textContent = 'Error: ' + resp.error;
        return;
      }
      
      const explanation = resp.data && (resp.data.explanation || JSON.stringify(resp.data, null, 2));
      resultDiv.textContent = explanation || 'No explanation returned.';
    });
  });
});
