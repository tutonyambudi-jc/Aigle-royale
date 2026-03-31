const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'app', 'api');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(apiDir);
let fixedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Pattern 1: catch (error) { ... error: 'Une erreur est survenue' ... }
    const patternError = /catch\s*\((error)\)\s*{[\s\S]*?error:\s*'Une erreur est survenue'[\s\S]*?}/g;
    if (patternError.test(content)) {
        content = content.replace(patternError, (match, varName) => {
            return match.replace(/'Une erreur est survenue'/, `\`Erreur technique (\${${varName} instanceof Error ? ${varName}.message : 'Inconnue'})\``);
        });
        changed = true;
    }

    // Pattern 2: catch (err) { ... error: 'Une erreur est survenue' ... }
    const patternErr = /catch\s*\((err)\)\s*{[\s\S]*?error:\s*'Une erreur est survenue'[\s\S]*?}/g;
    if (patternErr.test(content)) {
        content = content.replace(patternErr, (match, varName) => {
            return match.replace(/'Une erreur est survenue'/, `\`Erreur technique (\${${varName} instanceof Error ? ${varName}.message : 'Inconnue'})\``);
        });
        changed = true;
    }

    // Pattern 3: Simple catch { ... error: 'Une erreur est survenue' ... } (no var named)
    // We try to catch this and maybe just give slightly more info
    const patternSimple = /catch\s*{\s*[\s\S]*?error:\s*'Une erreur est survenue'[\s\S]*?}/g;
    if (patternSimple.test(content)) {
        content = content.replace(patternSimple, (match) => {
            return match.replace(/'Une erreur est survenue'/, `'Une erreur est survenue (API Interne)'`);
        });
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        fixedCount++;
        console.log(`Fixed: ${path.relative(apiDir, file)}`);
    }
});

console.log(`\nDone! Refactored ${fixedCount} files.`);
