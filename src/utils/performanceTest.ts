// Performance test utility for language switching
export const testLanguageSwitchingPerformance = () => {
  const startTime = performance.now();
  
  // Simulate language change
  const event = new CustomEvent('languageChanged', {
    detail: { language: 'hi' }
  });
  
  window.dispatchEvent(event);
  
  // Measure time after event dispatch
  requestAnimationFrame(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Language switch performance: ${duration.toFixed(2)}ms`);
    
    if (duration > 16) { // 60fps = 16.67ms per frame
      console.warn('Language switch took longer than one frame, may cause stuttering');
    } else {
      console.log('Language switch performance is good');
    }
  });
};

// Test multiple rapid language switches
export const testRapidLanguageSwitches = () => {
  const languages = ['en', 'hi', 'ar', 'zh'];
  let currentIndex = 0;
  
  const switchLanguage = () => {
    const startTime = performance.now();
    
    const event = new CustomEvent('languageChanged', {
      detail: { language: languages[currentIndex] }
    });
    
    window.dispatchEvent(event);
    
    requestAnimationFrame(() => {
      const endTime = performance.now();
      console.log(`Switch to ${languages[currentIndex]}: ${(endTime - startTime).toFixed(2)}ms`);
    });
    
    currentIndex = (currentIndex + 1) % languages.length;
  };
  
  // Test 10 rapid switches
  for (let i = 0; i < 10; i++) {
    setTimeout(switchLanguage, i * 100);
  }
};
