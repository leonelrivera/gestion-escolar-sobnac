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

    // Caso 1: Estaba originalmente en comillas simples. Ej: '`${process.env...}`/auth/login'
    content = content.replace(/'`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| "http:\/\/localhost:3001"\}`(.*?)'/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}$1`');

    // Caso 2: Estaba originalmente en acentos graves (Template literal). Ej: ``${process.env...}`/students?curso=${...}`
    content = content.replace(/``\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| "http:\/\/localhost:3001"\}`/g, '`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}');

    if (content !== original) {
        fs.writeFileSync(file, content);
        modifiedCount++;
    }
});

console.log(`Corregido el error de sintaxis en ${modifiedCount} archivos.`);
