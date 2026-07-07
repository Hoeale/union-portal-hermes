# PowerShell 脚本：自动上传部署包到服务器
# 使用方法: .\deploy\upload-to-server.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  工会门户 - 文件上传脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查部署包是否存在
$tarballPath = "E:\CCProject\union_portal-deploy.tar.gz"
if (-not (Test-Path $tarballPath)) {
    Write-Host "错误: 找不到部署包 $tarballPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先运行以下命令创建部署包:" -ForegroundColor Yellow
    Write-Host "cd 'E:\CCProject\4.9 工会门户2'"
    Write-Host "tar -czf ../union_portal-deploy.tar.gz --exclude='node_modules' --exclude='.next' --exclude='.git' ."
    exit 1
}

# 获取服务器信息
Write-Host "请输入服务器信息:" -ForegroundColor Green
$server = Read-Host "服务器地址 (IP 或域名)"
$user = Read-Host "SSH 用户名"

Write-Host ""
Write-Host "正在上传文件到 $user@$server`:/tmp/ ..." -ForegroundColor Yellow
Write-Host ""

# 使用 SCP 上传文件 (需要安装 OpenSSH 或 PuTTY's pscp)
$scpCommand = "scp $tarballPath ${user}@${server}:/tmp/"

# 检查是否有 scp 命令
if (Get-Command scp -ErrorAction SilentlyContinue) {
    Invoke-Expression $scpCommand
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  文件上传完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步，SSH 登录服务器并运行:" -ForegroundColor Cyan
    Write-Host "1. ssh $user@$server" -ForegroundColor White
    Write-Host "2. sudo bash deploy/setup-server.sh" -ForegroundColor White
    Write-Host "3. cd /var/www/union-portal && bash deploy-app.sh" -ForegroundColor White
    Write-Host ""
} elseif (Get-Command pscp -ErrorAction SilentlyContinue) {
    # 使用 PuTTY's pscp
    pscp $tarballPath "${user}@${server}:/tmp/"
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  文件上传完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步，使用 PuTTY SSH 登录服务器并运行:" -ForegroundColor Cyan
    Write-Host "1. sudo bash deploy/setup-server.sh" -ForegroundColor White
    Write-Host "2. cd /var/www/union-portal && bash deploy-app.sh" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "错误: 找不到 scp 或 pscp 命令" -ForegroundColor Red
    Write-Host ""
    Write-Host "请安装以下工具之一:" -ForegroundColor Yellow
    Write-Host "1. Windows 内置 OpenSSH (设置 → 应用 → 可选功能)" -ForegroundColor White
    Write-Host "2. PuTTY (https://www.putty.org/)" -ForegroundColor White
    Write-Host ""
    Write-Host "或者使用 WinSCP 图形界面上传文件:" -ForegroundColor Yellow
    Write-Host "- 协议: SFTP" -ForegroundColor White
    Write-Host "- 主机: $server" -ForegroundColor White
    Write-Host "- 用户名: $user" -ForegroundColor White
    Write-Host "- 上传 $tarballPath 到 /tmp/" -ForegroundColor White
    Write-Host ""
}
