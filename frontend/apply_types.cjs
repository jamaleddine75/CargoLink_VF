const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src', 'services', 'api');
const backendTypes = path.join(__dirname, 'src', 'types', 'backend.ts');

const backendContent = fs.readFileSync(backendTypes, 'utf8');

// Extract all available types
const typeRegex = /export (?:interface|type) ([A-Za-z0-9_]+)/g;
const availableTypes = new Set();
let match;
while ((match = typeRegex.exec(backendContent)) !== null) {
    availableTypes.add(match[1]);
}

function processServiceFiles() {
    const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.ts'));
    for (const file of files) {
        const fullPath = path.join(apiDir, file);
        let content = fs.readFileSync(fullPath, 'utf8');
        let changed = false;

        // Try to guess the return type from the function name
        const funcRegex = /([a-zA-Z0-9_]+)\s*[:=]\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>\s*Promise<unknown>/g;
        
        let funcMatch;
        let importsToAdd = new Set();

        while ((funcMatch = funcRegex.exec(content)) !== null) {
            const funcName = funcMatch[1];
            let guessedType = 'unknown';

            if (funcName.includes('getTaskAnalytics')) guessedType = 'TaskAnalyticsResponse';
            else if (funcName.includes('DashboardStats')) guessedType = 'DashboardStatsResponse';
            else if (funcName.includes('Agencies')) guessedType = 'PagedResponse<AgencyResponse>';
            else if (funcName.includes('Agency')) guessedType = 'AgencyResponse';
            else if (funcName.includes('Drivers')) guessedType = 'PagedResponse<DriverResponse>';
            else if (funcName.includes('Driver')) guessedType = 'DriverResponse';
            else if (funcName.includes('Orders')) guessedType = 'PagedResponse<OrderResponse>';
            else if (funcName.includes('Order')) guessedType = 'OrderResponse';
            else if (funcName.includes('Users')) guessedType = 'PagedResponse<UserResponse>';
            else if (funcName.includes('User')) guessedType = 'UserResponse';
            else if (funcName.includes('Notification')) guessedType = 'NotificationResponse[]';
            else if (funcName.includes('Transactions')) guessedType = 'PagedResponse<TransactionResponse>';
            else if (funcName.includes('Transaction')) guessedType = 'TransactionResponse';
            else if (funcName.includes('Wallet')) guessedType = 'WalletResponse';

            // Clean the generic wrapper for import checking
            const baseType = guessedType.replace('PagedResponse<', '').replace('>', '').replace('[]', '');

            if (guessedType !== 'unknown' && availableTypes.has(baseType)) {
                // Replace in the file
                const targetStr = `Promise<unknown>`;
                const replacementStr = `Promise<${guessedType}>`;
                
                // Do a localized replace around this function
                const startIndex = Math.max(0, funcMatch.index - 50);
                const endIndex = Math.min(content.length, funcMatch.index + 150);
                const block = content.substring(startIndex, endIndex);
                const newBlock = block.replace(targetStr, replacementStr);
                content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
                
                importsToAdd.add(baseType);
                if (guessedType.includes('PagedResponse')) importsToAdd.add('PagedResponse');
                changed = true;
                
                // Reset regex since we modified the string
                funcRegex.lastIndex = 0;
            }
        }

        if (changed) {
            // Add imports
            if (importsToAdd.size > 0) {
                const importStr = `import { ${Array.from(importsToAdd).join(', ')} } from '../../types/backend';\n`;
                content = importStr + content;
            }
            fs.writeFileSync(fullPath, content);
            console.log(`Updated ${file}`);
        }
    }
}

processServiceFiles();
console.log('Finished updating service files.');
