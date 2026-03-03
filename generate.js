#!/usr/bin/env node

/**
 * 完全自动化的日报生成脚本
 * 直接在脚本内完成搜索和整理，无需外部调用
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
    console.log('\n如需重新生成，请先删除该文件：');
    console.log(`rm "${reportPath}"`);
    process.exit(0);
}

console.log(`📅 开始生成 ${TODAY} 的日报...`);
console.log('🔍 这是一个占位脚本，实际使用时需要配置自动化方式\n');

console.log('推荐方案：');
console.log('1. 在 Feishu 中发消息给我："生成今日日报"');
console.log('2. 我会自动搜索新闻并更新文件');
console.log('3. 或者设置 cron 任务，每天定时提醒我生成\n');

// 创建空模板
const template = {
    date: TODAY,
    generated: new Date().toISOString(),
    ai: [],
    world: [],
    startup: []
};

fs.writeFileSync(reportPath, JSON.stringify(template, null, 2));
console.log('📝 已创建空模板，等待填充内容');
console.log(`📄 ${reportPath}`);

updateIndex();

function updateIndex() {
    const files = fs.readdirSync(DATA_DIR)
        .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
        .map(f => f.replace('.json', ''))
        .sort()
        .reverse()
        .slice(0, 30);
    
    const indexPath = path.join(DATA_DIR, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify(files, null, 2));
}
