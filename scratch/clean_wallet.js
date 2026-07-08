const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'com', 'deliveryplatform', 'controller', 'WalletController.java');
let content = fs.readFileSync(filePath, 'utf8');

// Also remove ADMIN from the class level PreAuthorize
content = content.replace(/@PreAuthorize\("hasAnyRole\('DRIVER', 'ADMIN', 'CLIENT', 'AGENCY'\)"\)/g, "@PreAuthorize(\"hasAnyRole('DRIVER', 'CLIENT', 'AGENCY')\")");
content = content.replace(/@PreAuthorize\("hasAnyRole\('AGENCY', 'ADMIN'\)"\)/g, "@PreAuthorize(\"hasRole('AGENCY')\")");

// Remove everything from "SUPER ADMIN endpoints" down to just before "@GetMapping("/agency/balance")"
const startIndex = content.indexOf('SUPER ADMIN endpoints');
const endIndex = content.indexOf('@GetMapping("/agency/balance")');

if (startIndex !== -1 && endIndex !== -1) {
    // Find the exact line of startIndex
    const actualStart = content.lastIndexOf('\n', startIndex);
    const actualEnd = content.lastIndexOf('\n', endIndex);
    
    const stringToRemove = content.substring(actualStart, actualEnd);
    content = content.replace(stringToRemove, '\n');
    console.log("Successfully removed ADMIN block.");
} else {
    console.log("Could not find bounds.");
}

fs.writeFileSync(filePath, content, 'utf8');
