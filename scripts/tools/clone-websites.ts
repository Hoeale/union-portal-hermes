import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const urls = [
  { name: 'shxgh', url: 'https://www.shxgh.org/', fullName: '陕西省总工会' },
  { name: 'xaszgh', url: 'https://www.xaszgh.cn/', fullName: '西安市总工会' },
];

async function captureWebsite(target: typeof urls[0]) {
  console.log(`\n=== 正在抓取: ${target.fullName} (${target.url}) ===`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  const researchDir = path.join('scripts', 'clone-research', target.name);
  fs.mkdirSync(researchDir, { recursive: true });

  try {
    // 访问页面
    await page.goto(target.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // 截图 - 整页
    await page.screenshot({
      path: path.join(researchDir, 'fullpage.png'),
      fullPage: true
    });
    console.log('✓ 整页截图已保存');

    // 截图 - 首屏
    await page.screenshot({
      path: path.join(researchDir, 'hero.png')
    });
    console.log('✓ 首屏截图已保存');

    // 提取页面信息
    const pageInfo = await page.evaluate(() => {
      const getComputedStyles = (selector: string) => {
        const el = document.querySelector(selector);
        if (!el) return null;
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          fontFamily: styles.fontFamily,
          fontSize: styles.fontSize,
        };
      };

      // 提取颜色
      const colors = new Set<string>();
      document.querySelectorAll('*').forEach(el => {
        const styles = window.getComputedStyle(el);
        colors.add(styles.backgroundColor);
        colors.add(styles.color);
      });

      // 提取导航
      const navItems: string[] = [];
      document.querySelectorAll('nav a, .nav a, .menu a, .navigation a, header a').forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length < 20) navItems.push(text);
      });

      // 提取主要内容区域
      const sections: { tag: string; className: string; text: string }[] = [];
      document.querySelectorAll('section, .section, .banner, .slider, .news, .notice').forEach(el => {
        sections.push({
          tag: el.tagName,
          className: el.className,
          text: el.textContent?.substring(0, 100) || ''
        });
      });

      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
        colors: Array.from(colors).slice(0, 30),
        navItems: Array.from(new Set(navItems)).slice(0, 20),
        sections: sections.slice(0, 15),
        mainContent: document.body.innerText.substring(0, 2000)
      };
    });

    // 保存页面信息
    fs.writeFileSync(
      path.join(researchDir, 'page-info.json'),
      JSON.stringify(pageInfo, null, 2)
    );
    console.log('✓ 页面信息已保存');

    // 提取链接
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map(a => ({
        text: a.textContent?.trim(),
        href: a.getAttribute('href')
      })).filter(l => l.text && l.text.length > 0 && l.text.length < 30);
    });

    fs.writeFileSync(
      path.join(researchDir, 'links.json'),
      JSON.stringify(links.slice(0, 50), null, 2)
    );
    console.log('✓ 链接信息已保存');

    // 保存研究摘要
    const summary = {
      name: target.name,
      fullName: target.fullName,
      url: target.url,
      title: pageInfo.title,
      description: pageInfo.description,
      colors: pageInfo.colors,
      navItems: pageInfo.navItems,
      captureDate: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(researchDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log(`\n=== ${target.fullName} 抓取完成 ===`);
    console.log(`标题: ${pageInfo.title}`);
    console.log(`导航项数: ${pageInfo.navItems.length}`);
    console.log(`主要颜色: ${pageInfo.colors.slice(0, 5).join(', ')}`);

  } catch (error) {
    console.error(`抓取 ${target.fullName} 失败:`, error);
  } finally {
    await browser.close();
  }
}

async function main() {
  for (const target of urls) {
    await captureWebsite(target);
  }
  console.log('\n\n所有网站抓取完成!');
}

main().catch(console.error);
