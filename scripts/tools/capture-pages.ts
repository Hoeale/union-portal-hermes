import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function capturePages() {
  console.log('正在启动浏览器...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const outputDir = path.join(process.cwd(), 'scripts', 'clone-research');
  fs.mkdirSync(outputDir, { recursive: true });

  // 截图 shxgh 页面
  console.log('\n=== 访问西安高新区总工会（红色主题） ===');
  const page1 = await context.newPage();
  try {
    await page1.goto('http://localhost:3001/shxgh', { waitUntil: 'networkidle', timeout: 30000 });
    await page1.waitForTimeout(3000);
    await page1.screenshot({ path: path.join(outputDir, 'shxgh-preview.png'), fullPage: true });
    console.log('✓ shxgh 整页截图已保存');
  } catch (err) {
    console.log('shxgh 页面截图失败:', err instanceof Error ? err.message : String(err));
    await page1.screenshot({ path: path.join(outputDir, 'shxgh-error.png'), fullPage: true });
  }

  // 截图 xaszgh 页面
  console.log('\n=== 访问西安高新区总工会（蓝紫主题） ===');
  const page2 = await context.newPage();
  try {
    await page2.goto('http://localhost:3001/xaszgh', { waitUntil: 'networkidle', timeout: 30000 });
    await page2.waitForTimeout(3000);
    await page2.screenshot({ path: path.join(outputDir, 'xaszgh-preview.png'), fullPage: true });
    console.log('✓ xaszgh 整页截图已保存');
  } catch (err) {
    console.log('xaszgh 页面截图失败:', err instanceof Error ? err.message : String(err));
    await page2.screenshot({ path: path.join(outputDir, 'xaszgh-error.png'), fullPage: true });
  }

  await browser.close();
  console.log('\n=== 所有页面截图完成 ===');
}

capturePages().catch(err => {
  console.error('截图失败:', err);
  process.exit(1);
});
