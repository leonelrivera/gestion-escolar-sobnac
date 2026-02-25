const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./frontend/app');
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix the botched replacement from the previous powershell script:
    // '`${process.env.NEXT_PUBLIC_API_URL || "${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}"}`/auth/login' -> '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}`/auth/login'
    content = content.replace(/['`]\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| ".*?localhost:3001.*?"\}['`]/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}`');
    
    // Also catch any remaining pure 'http://localhost:3001' strings
    content = content.replace(/'http:\/\/localhost:3001/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}`');

    if (content !== original) {
        fs.writeFileSync(file, content);
        modifiedCount++;
    }
});

console.log(`Replaced in ${modifiedCount} files.`);
