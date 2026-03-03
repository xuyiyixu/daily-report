#!/usr/bin/env node

/**
 * 自动生成每日热点报告
 * 使用 OpenClaw 的 message 工具调用 AI 助手来搜索和整理新闻
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR = path.join(__dirname, 'data');
const TODAY = new Date().toISOString().split('T')[0];

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 检查今日报告是否已存在
const reportPath = path.join(DATA_DIR, `${TODAY}.json`);
if (fs.existsSync(reportPath)) {
    console.log('✅ 今日报告已存在');
    console.log(`📄 ${reportPath}`);
    process.exit(0);
}

console.log(`📅 开始生成 ${TODAY} 的日报...`);
console.log('🔍 正在搜索热点新闻（需要 2-3 分钟）...\n');

try {
    // 调用当前 OpenClaw 会话来生成报告
    const prompt = `请帮我搜索并整理今天的热点新闻，生成日报数据。

要求：
1. 分三个板块：AI科技、国际形势、产品创业
2. 每个板块 5 条新闻
3. 每条包含：title（中文标题）、snippet（50字内摘要）、url（原文链接）
4. 直接返回 JSON，格式如下：

{
  "ai": [{title, snippet, url}, ...],
  "world": [{title, snippet, url}, ...],
  "startup": [{title, snippet, url}, ...]
}

只返回 JSON，不要其他文字。`;

    // 将 prompt 写入临时文件
    const tmpFile = path.join(__dirname, '.prompt.tmp');
    fs.writeFileSync(tmpFile, prompt);

    // 通过标准输入传递给 OpenClaw
    const result = execSync(
        `cat "${tmpFile}" | openclaw chat --stdin --format json`,
        { 
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
            stdio: ['pipe', 'pipe', 'inherit']
        }
    );

    // 清理临时文件
    fs.unlinkSync(tmpFile);

    // 解析返回的 JSON
    let newsData;
    try {
        // 尝试直接解析
        newsData = JSON.parse(result);
    } catch (e) {
        // 如果失败，尝试提取 JSON 部分
        const jsonMatch = result.match(/\{[\s\S]*"ai"[\s\S]*"world"[\s\S]*"startup"[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('无法从响应中提取 JSON 数据');
        }
        newsData = JSON.parse(jsonMatch[0]);
    }

    // 验证数据结构
    if (!newsData.ai || !newsData.world || !newsData.startup) {
        throw new Error('返回的数据格式不正确');
    }

    // 构建完整报告
    const report = {
        date: TODAY,
        generated: new Date().toISOString(),
        ...newsData
    };

    // 保存报告
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n✅ 报告生成成功！');
    console.log(`📄 ${reportPath}`);
    console.log(`   🤖 AI科技: ${report.ai.length} 条`);
    console.log(`   🌐 国际形势: ${report.world.length} 条`);
    console.log(`   🚀 产品创业: ${report.startup.length} 条`);

    // 更新索引
    updateIndex();

} catch (error) {
    console.error('\n❌ 生成失败:', error.message);
    console.error('\n提示：确保 OpenClaw 正在运行，并且已配置 Brave API key');
    console.error('配置命令：openclaw configure --section web');
    process.exit(1);
}

function updateIndex() {
    const files = fs.readdirSync(DATA_DIR)
        .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
        .map(f => f.replace('.json', ''))
        .sort()
        .reverse()
        .slice(0, 30);
    
    const indexPath = path.join(DATA_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(files, null, 2));
    console.log(`📋 索引已更新: ${files.length} 份报告`);
}
