import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function captureAllStyles() {
  console.log('正在启动浏览器...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const outputDir = path.join(process.cwd(), 'scripts', 'clone-research', 'styles-summary');
  fs.mkdirSync(outputDir, { recursive: true });

  const styles = [
    { name: '原始首页', url: 'http://localhost:3001/', file: 'style-1-original.png' },
    { name: 'V2版本', url: 'http://localhost:3001/v2', file: 'style-2-v2.png' },
    { name: '红色主题(shxgh)', url: 'http://localhost:3001/shxgh', file: 'style-3-shxgh.png' },
    { name: '蓝紫主题(xaszgh)', url: 'http://localhost:3001/xaszgh', file: 'style-4-xaszgh.png' },
  ];

  for (const style of styles) {
    console.log(`\n=== 截图: ${style.name} ===`);
    const page = await context.newPage();
    try {
      await page.goto(style.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(outputDir, style.file), fullPage: false });
      console.log(`✓ ${style.name} 截图已保存: ${style.file}`);
    } catch (err) {
      console.log(`✗ ${style.name} 截图失败:`, err instanceof Error ? err.message : String(err));
    }
    await page.close();
  }

  await browser.close();
  console.log('\n=== 所有风格截图完成 ===');
}

captureAllStyles().catch(console.error);
