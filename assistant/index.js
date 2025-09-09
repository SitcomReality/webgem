// Bootstrap assistant after app is ready
(function waitForApp() {
  if (window.app && Array.isArray(window.app.currentProjects)) {
    window.AssistantUI.init();
  } else {
    setTimeout(waitForApp, 200);
  }
})();