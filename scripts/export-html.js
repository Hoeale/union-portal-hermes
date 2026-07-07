const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 可通过环境变量 BASE_URL 配置
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function exportPages() {
  console.log('正在启动浏览器...\n');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const pagesToExport = [
    { url: `${BASE_URL}/`, name: 'index', title: '首页' },
    { url: `${BASE_URL}/about`, name: 'about', title: '关于我们' },
    { url: `${BASE_URL}/policies`, name: 'policies', title: '政策文件' },
    { url: `${BASE_URL}/services`, name: 'services', title: '职工服务' },
    { url: `${BASE_URL}/workers`, name: 'workers', title: '工会风采' },
    { url: `${BASE_URL}/search`, name: 'search', title: '搜索' },
  ];

  const outputDir = path.join(__dirname, '..', 'exported-html');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 复制静态资源
  const publicDir = path.join(__dirname, '..', 'public');
  if (fs.existsSync(publicDir)) {
    copyDir(publicDir, path.join(outputDir, 'public'));
  }

  for (const pageInfo of pagesToExport) {
    try {
      console.log(`正在导出: ${pageInfo.title} (${pageInfo.url})`);
      const page = await browser.newPage();

      await page.setViewport({ width: 1920, height: 1080 });

      await page.goto(pageInfo.url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // 等待页面基本加载完成
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 5000)));

      // 获取页面HTML并处理资源路径
      let html = await page.content();

      // 修复资源路径
      html = html.replace(/href="\//g, 'href="./');
      html = html.replace(/src="\//g, 'src="./');
      html = html.replace(/url\(\//g, 'url(./');

      // 添加基路径
      html = html.replace('<head>', '<head>\n  <base href="./">');

      const fileName = `${pageInfo.name}.html`;
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, html, 'utf-8');

      console.log(`✓ 成功导出: ${fileName}`);
      await page.close();
    } catch (error) {
      console.error(`✗ 导出失败 ${pageInfo.url}:`, error.message);
    }
  }

  await browser.close();

  // 生成索引文件
  generateIndex(outputDir, pagesToExport);

  console.log(`\n========================================`);
  console.log(`导出完成！文件保存在: ${outputDir}`);
  console.log(`========================================`);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function generateIndex(outputDir, pages) {
  const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>高新区总工会 - 页面导出索引</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 600px;
      width: 100%;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .page-list {
      list-style: none;
    }
    .page-list li {
      margin-bottom: 15px;
    }
    .page-list a {
      display: flex;
      align-items: center;
      padding: 15px 20px;
      background: #f8f9fa;
      border-radius: 10px;
      text-decoration: none;
      color: #333;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }
    .page-list a:hover {
      background: #667eea;
      color: white;
      transform: translateX(10px);
      border-color: #764ba2;
    }
    .page-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-right: 15px;
      font-weight: bold;
    }
    .page-list a:hover .page-icon {
      background: white;
      color: #667eea;
    }
    .page-info {
      flex: 1;
    }
    .page-title {
      font-weight: 600;
      font-size: 16px;
    }
    .page-url {
      font-size: 12px;
      color: #999;
      margin-top: 2px;
    }
    .page-list a:hover .page-url {
      color: rgba(255,255,255,0.8);
    }
    .arrow {
      color: #999;
      font-size: 20px;
    }
    .page-list a:hover .arrow {
      color: white;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>高新区总工会网站</h1>
    <p class="subtitle">前端页面导出索引 - 共 ${pages.length} 个页面</p>
    <ul class="page-list">
      ${pages.map((p, i) => `
      <li>
        <a href="${p.name}.html">
          <div class="page-icon">${i + 1}</div>
          <div class="page-info">
            <div class="page-title">${p.title}</div>
            <div class="page-url">${p.url}</div>
          </div>
          <span class="arrow">→</span>
        </a>
      </li>
      `).join('')}
    </ul>
    <div class="footer">
      导出时间: ${new Date().toLocaleString('zh-CN')}
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml, 'utf-8');
}

// 检查开发服务器
const http = require('http');
const url = new URL(BASE_URL);
const options = {
  hostname: url.hostname,
  port: url.port || 80,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log('✓ 开发服务器检测正常\n');
  exportPages();
});

req.on('error', (e) => {
  console.error('✗ 错误: 开发服务器未运行！');
  console.error('请先运行: npm run dev');
  process.exit(1);
});

req.end();
