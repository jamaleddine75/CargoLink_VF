const fs = require('fs');

function replaceAllInFile(filePath, searchStr, replaceStr) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.split(searchStr).join(replaceStr);
    fs.writeFileSync(filePath, content);
}

replaceAllInFile('./src/pages/client/CreateOrder.tsx', '(error: any)', '(error: unknown)');
replaceAllInFile('./src/pages/client/CustomerWallet.tsx', '(tx: any)', '(tx: unknown)');
replaceAllInFile('./src/pages/client/OrderTrackingDashboard.tsx', '(t: any)', '(t: unknown)');
replaceAllInFile('./src/pages/driver/DriverProfile.tsx', '(error: any)', '(error: unknown)');
replaceAllInFile('./src/pages/driver/WalletPage.tsx', '// @ts-ignore', '// @ts-expect-error');

