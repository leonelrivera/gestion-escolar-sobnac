const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const docsDir = path.join(__dirname, '../docs');

async function main() {
    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.pdf'));

    for (const file of files) {
        console.log(`\n--- ANALYZING: ${file} ---`);
        const dataBuffer = fs.readFileSync(path.join(docsDir, file));
        try {
            const data = await pdf(dataBuffer);
            console.log(data.text.substring(0, 2000)); 
        } catch (e) {
            console.error(`Error parsing ${file}:`, e);
            console.log('Export type:', typeof pdf);
        }
    }
}

main();
