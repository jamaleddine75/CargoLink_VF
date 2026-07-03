const fs = require('fs');
function replaceInFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const r of replacements) {
        content = content.replace(r.search, r.replace);
    }
    fs.writeFileSync(filePath, content);
}
try {
    replaceInFile('./tests/negative-tests.spec.ts', [
        { search: 'catch (error: any)', replace: 'catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)' },
        { search: 'catch (error: any)', replace: 'catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)' },
        { search: 'catch (error: any)', replace: 'catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)' },
        { search: 'catch (error: any)', replace: 'catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */)' }
    ]);
} catch (e) { console.error(e); }
