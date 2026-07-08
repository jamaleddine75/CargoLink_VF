const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'com', 'deliveryplatform', 'service', 'WalletService.java');
let content = fs.readFileSync(filePath, 'utf8');

// Strip the ADMIN endpoints section if present
const startIndex = content.indexOf('// === ADMIN:');
const endIndex = content.indexOf('// === AGENCY:');

if (startIndex !== -1 && endIndex !== -1) {
    const actualStart = content.lastIndexOf('\n', startIndex);
    const actualEnd = content.lastIndexOf('\n', endIndex);
    
    const stringToRemove = content.substring(actualStart, actualEnd);
    content = content.replace(stringToRemove, '\n');
    console.log("Successfully removed ADMIN block from WalletService.");
} else {
    console.log("Could not find bounds in WalletService.");
}

fs.writeFileSync(filePath, content, 'utf8');
