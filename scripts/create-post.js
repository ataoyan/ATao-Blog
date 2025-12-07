import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建 readline 接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 提问函数
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// 获取当前日期，格式化为 年/月
function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return { year, month };
}

// 将标题转换为文件名（移除特殊字符）
function titleToFileName(title) {
  if (!title) {
    return 'untitled';
  }
  
  let fileName = title
    // 移除 Windows 不允许的字符: < > : " / \ | ? * #
    .replace(/[<>:"/\\|?*#]/g, '')
    // 替换多个空格为单个空格
    .replace(/\s+/g, ' ')
    // 移除首尾空格
    .trim();
  
  // 如果文件名为空，使用默认名称
  if (!fileName) {
    return 'untitled';
  }
  
  return fileName;
}

// 格式化日期为中文格式
function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

// 创建文章模板
function createPostTemplate(title, date) {
  return `---
title: ${title}
date: '${date}'
tags: []
summary: 
---

## 前言



## 正文



## 总结



`;
}

// 主函数
async function main() {
  try {
    console.log('📝 创建新博客文章\n');
    
    // 获取标题
    const title = await question('请输入文章标题: ');
    if (!title || !title.trim()) {
      console.log('❌ 标题不能为空！');
      rl.close();
      process.exit(1);
    }
    
    // 获取日期（可选，默认今天）
    const dateInput = await question(`请输入发布日期 (格式: YYYY-MM-DD，直接回车使用今天): `);
    let postDate = new Date();
    if (dateInput.trim()) {
      const parsedDate = new Date(dateInput.trim());
      if (isNaN(parsedDate.getTime())) {
        console.log('⚠️  日期格式无效，使用今天作为发布日期');
      } else {
        postDate = parsedDate;
      }
    }
    
    // 根据输入的日期获取目标目录
    const year = postDate.getFullYear();
    const month = String(postDate.getMonth() + 1).padStart(2, '0');
    const blogDir = path.join(__dirname, '../src/content/blog');
    const targetDir = path.join(blogDir, String(year), month);
    
    // 确保目录存在
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      console.log(`✓ 创建目录: ${year}/${month}`);
    }
    
    // 生成文件名
    const fileName = titleToFileName(title) + '.md';
    const filePath = path.join(targetDir, fileName);
    
    // 检查文件是否已存在
    if (fs.existsSync(filePath)) {
      const overwrite = await question(`文件已存在: ${filePath}\n是否覆盖? (y/N): `);
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ 已取消');
        rl.close();
        process.exit(0);
      }
    }
    
    // 创建文章内容
    const formattedDate = formatDate(postDate);
    const content = createPostTemplate(title, formattedDate);
    
    // 写入文件
    fs.writeFileSync(filePath, content, 'utf-8');
    
    console.log(`\n✅ 文章创建成功！`);
    console.log(`📁 路径: ${path.relative(process.cwd(), filePath)}`);
    console.log(`📅 日期: ${formattedDate}`);
    console.log(`\n💡 提示: 编辑文件后记得填写 summary 和 tags`);
    
  } catch (error) {
    console.error('❌ 创建文章时出错:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

