const fs = require('fs');
const path = require('path');

const javaDir = path.join(__dirname, '..', 'backend', 'src', 'main', 'java', 'com', 'deliveryplatform');
const outputTsFile = path.join(__dirname, 'src', 'types', 'backend.ts');

function mapJavaTypeToTs(type) {
    if (!type) return 'any';
    type = type.trim();
    if (type === 'String') return 'string';
    if (type === 'Long' || type === 'Integer' || type === 'Double' || type === 'BigDecimal' || type === 'Float' || type === 'int' || type === 'long' || type === 'double' || type === 'float') return 'number';
    if (type === 'Boolean' || type === 'boolean') return 'boolean';
    if (type === 'LocalDateTime' || type === 'LocalDate' || type === 'Instant' || type === 'ZonedDateTime') return 'string';
    if (type.startsWith('List<') || type.startsWith('Set<') || type.startsWith('Collection<')) {
        const innerMatch = type.match(/<(.*)>/);
        if (innerMatch) {
            return `${mapJavaTypeToTs(innerMatch[1])}[]`;
        }
        return 'any[]';
    }
    if (type.startsWith('Map<')) {
        const innerMatch = type.match(/<(.*),\s*(.*)>/);
        if (innerMatch) {
            return `Record<${mapJavaTypeToTs(innerMatch[1])}, ${mapJavaTypeToTs(innerMatch[2])}>`;
        }
        return 'Record<string, any>';
    }
    // Handle enums or custom classes (assuming they will also be generated)
    return type;
}

let tsOutput = `// Auto-generated backend types\n\n`;

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.java')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Check if it's an enum
            const enumMatch = content.match(/public\s+enum\s+(\w+)\s*\{([^}]*)\}/);
            if (enumMatch) {
                const enumName = enumMatch[1];
                const enumBody = enumMatch[2];
                // Extract enum values, ignoring methods or fields after semicolon
                const cleanBody = enumBody.split(';')[0];
                const values = cleanBody.split(',').map(v => v.trim()).filter(v => !!v && !v.startsWith('//') && !v.includes('('));
                
                if (values.length > 0) {
                    tsOutput += `export type ${enumName} = \n  | ` + values.map(v => `'${v}'`).join('\n  | ') + ';\n\n';
                }
                continue;
            }

            // Check if it's a class or record
            const classMatch = content.match(/public\s+(?:class|record)\s+(\w+)(?:<[^>]+>)?/);
            if (classMatch) {
                const className = classMatch[1];
                // Skip generic entity classes if they are too complex, but let's try.
                tsOutput += `export interface ${className} {\n`;
                
                // Extract fields
                const fieldRegex = /private\s+([A-Za-z0-9_<>,\s]+?)\s+([a-zA-Z0-9_]+)\s*;/g;
                let match;
                while ((match = fieldRegex.exec(content)) !== null) {
                    const type = match[1];
                    const name = match[2];
                    tsOutput += `  ${name}?: ${mapJavaTypeToTs(type)};\n`;
                }

                // For records, fields are in the header
                const recordMatch = content.match(/public\s+record\s+(\w+)\s*\(([^)]+)\)/);
                if (recordMatch) {
                    const params = recordMatch[2].split(',');
                    for (const p of params) {
                        const parts = p.trim().split(/\s+/);
                        if (parts.length >= 2) {
                            const type = parts[parts.length - 2];
                            const name = parts[parts.length - 1];
                            tsOutput += `  ${name}?: ${mapJavaTypeToTs(type)};\n`;
                        }
                    }
                }
                
                tsOutput += `}\n\n`;
            }
        }
    }
}

// Process Enums (commonly in domain)
const domainDir = path.join(javaDir, 'domain');
if (fs.existsSync(domainDir)) processDirectory(domainDir);

// Process DTOs
const dtoDir = path.join(javaDir, 'dto');
if (fs.existsSync(dtoDir)) processDirectory(dtoDir);

fs.writeFileSync(outputTsFile, tsOutput);
console.log('Successfully generated backend.ts with DTOs and Enums.');
