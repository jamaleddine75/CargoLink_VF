import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

project.addSourceFilesAtPaths('src/**/*.ts');
project.addSourceFilesAtPaths('src/**/*.tsx');

let filesChanged = 0;

project.getSourceFiles().forEach((sourceFile) => {
  let changed = false;

  // 1. Remove console.logs
  sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpr) => {
    try {
      const expr = callExpr.getExpression();
      if (expr && expr.getKind() === SyntaxKind.PropertyAccessExpression) {
        const text = expr.getText();
        if (['console.log', 'console.info', 'console.debug'].includes(text)) {
          const parent = callExpr.getParent();
          if (parent && parent.getKind() === SyntaxKind.ExpressionStatement) {
            parent.remove();
            changed = true;
          }
        }
      }
    } catch (e) {
      // Ignore removed node errors
    }
  });

  // 2. Replace 'any' with 'unknown'
  // Be careful with replacing nodes while iterating
  const anyNodes = sourceFile.getDescendantsOfKind(SyntaxKind.AnyKeyword);
  if (anyNodes.length > 0) {
      anyNodes.forEach((anyNode) => {
        try {
            anyNode.replaceWithText('unknown');
            changed = true;
        } catch(e) {}
      });
  }

  if (changed) {
    sourceFile.saveSync();
    filesChanged++;
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
});

console.log(`\nAutomated fixes complete. Modified ${filesChanged} files.`);
