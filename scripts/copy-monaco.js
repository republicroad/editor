#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..', 'node_modules', 'monaco-editor', 'min');
const targetDir = path.join(__dirname, '..', 'public', 'monaco');

// 确保目标目录存在
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 复制Monaco文件
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  console.log('正在复制Monaco编辑器文件...');
  copyRecursive(sourceDir, path.join(targetDir, 'min'));
  console.log('Monaco编辑器文件复制完成！');
  console.log(`源目录: ${sourceDir}`);
  console.log(`目标目录: ${path.join(targetDir, 'min')}`);
} catch (error) {
  console.error('复制Monaco文件时出错:', error);
  process.exit(1);
}