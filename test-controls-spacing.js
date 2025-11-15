import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
  await new Promise(resolve => setTimeout(resolve, 2000));

  const spacing = await page.evaluate(() => {
    const allElements = Array.from(document.querySelectorAll('*'));

    // Find the Controls title - it's likely in a CardTitle component (h3)
    const controlsTitle = allElements.find(el => {
      // Match element with exact text "Controls" that's a small leaf node
      return el.textContent?.trim() === 'Controls' &&
             el.children.length === 0; // leaf node
    });

    if (!controlsTitle) {
      // Debug: show elements containing "Controls"
      const controlsElements = Array.from(document.querySelectorAll('*'))
        .filter(el => el.textContent?.includes('Controls') && el.children.length <= 2)
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
          classes: el.className,
          childCount: el.children.length
        }));

      return {
        found: false,
        controlsElements
      };
    }

    // Find the first Zoom label
    const zoomLabel = allElements.find(el =>
      el.textContent?.trim() === 'Zoom' && el.tagName === 'LABEL'
    );

    if (!zoomLabel) return { found: false, noZoomLabel: true };

    const titleRect = controlsTitle.getBoundingClientRect();
    const zoomRect = zoomLabel.getBoundingClientRect();

    // Try to find separator - look for it near the Controls title
    const cardContent = controlsTitle.closest('[class*="card"]') ||
                        controlsTitle.parentElement?.nextElementSibling;

    // Search for separator using the correct attribute
    let separator = cardContent?.querySelector('[data-slot="separator"]');
    if (!separator) {
      separator = cardContent?.querySelector('[role="separator"]');
    }
    if (!separator) {
      separator = cardContent?.querySelector('hr');
    }

    // Also try to find all separators on the page for debugging
    const allSeparators = Array.from(document.querySelectorAll('[data-slot="separator"], [role="separator"], hr')).map(sep => {
      const rect = sep.getBoundingClientRect();
      return {
        tag: sep.tagName,
        dataSlot: sep.getAttribute('data-slot'),
        dataOrientation: sep.getAttribute('data-orientation'),
        role: sep.getAttribute('role'),
        classes: sep.className,
        rect: {
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height,
          width: rect.width
        }
      };
    });

    return {
      found: true,
      titleBottom: titleRect.bottom,
      zoomTop: zoomRect.top,
      gap: zoomRect.top - titleRect.bottom,
      titleRect: {
        top: titleRect.top,
        bottom: titleRect.bottom,
        height: titleRect.height
      },
      zoomRect: {
        top: zoomRect.top,
        bottom: zoomRect.bottom,
        height: zoomRect.height
      },
      hasSeparator: !!separator,
      separatorInfo: separator ? {
        top: separator.getBoundingClientRect().top,
        bottom: separator.getBoundingClientRect().bottom,
        gapFromTitle: separator.getBoundingClientRect().top - titleRect.bottom,
        gapToZoom: zoomRect.top - separator.getBoundingClientRect().bottom
      } : null,
      allSeparators
    };
  });

  console.log('Spacing measurement:', JSON.stringify(spacing, null, 2));

  await page.screenshot({ path: '/tmp/controls-spacing.png' });
  console.log('Screenshot saved to /tmp/controls-spacing.png');

  await browser.close();
})();
