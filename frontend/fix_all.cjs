const fs = require('fs');
const glob = require('fs');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    for (const r of replacements) {
        content = content.replace(r.search, r.replace);
    }
    fs.writeFileSync(filePath, content);
}

replaceInFile('./src/pages/client/CreateOrder.tsx', [
    { search: /catch\s*\(\s*error\s*:\s*any\s*\)/g, replace: 'catch (error: unknown)' },
    { search: /:\s*any\s*=>/g, replace: ': unknown =>' }
]);
replaceInFile('./src/pages/client/CustomerWallet.tsx', [
    { search: /\(\s*tx\s*:\s*any\s*\)/g, replace: '(tx: unknown)' }
]);
replaceInFile('./src/pages/client/OrderTrackingDashboard.tsx', [
    { search: /let\s+pickup\s+=/g, replace: 'const pickup =' },
    { search: /let\s+delivery\s+=/g, replace: 'const delivery =' },
    { search: /\(\s*t\s*:\s*any\s*\)/g, replace: '(t: unknown)' }
]);
replaceInFile('./src/pages/driver/DriverProfile.tsx', [
    { search: /catch\s*\(\s*error\s*:\s*any\s*\)/g, replace: 'catch (error: unknown)' }
]);
replaceInFile('./src/pages/driver/WalletPage.tsx', [
    { search: /\/\/\s*@ts-ignore/g, replace: '// @ts-expect-error' }
]);
replaceInFile('./tests/negative-tests.spec.ts', [
    { search: /:\s*any/g, replace: ': unknown' }
]);

