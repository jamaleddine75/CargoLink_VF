import { Project, SyntaxKind } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

// Load all ts and tsx files
project.addSourceFilesAtPaths('src/**/*.ts');
project.addSourceFilesAtPaths('src/**/*.tsx');

let filesChanged = 0;

project.getSourceFiles().forEach((sourceFile) => {
  let changed = false;

  sourceFile.getVariableStatements().forEach((stmt) => {
    const comments = stmt.getLeadingCommentRanges().map(c => c.getText()).join(' ');
    const hasMockComment = /mock|dummy|fake|sample/i.test(comments);
    
    stmt.getDeclarations().forEach((varDecl) => {
      const varName = varDecl.getName();
      const initializer = varDecl.getInitializer();

      const hasMockName = /mock|dummy|fake|sample/i.test(varName);

      if (initializer && (hasMockComment || hasMockName)) {
        console.log(`Found mock data in ${sourceFile.getFilePath()}: ${varName}`);
        
        if (initializer.getKind() === SyntaxKind.ArrayLiteralExpression) {
          initializer.replaceWithText('[]');
          changed = true;
        } else if (initializer.getKind() === SyntaxKind.ObjectLiteralExpression) {
          initializer.replaceWithText('{}');
          changed = true;
        }
      }
    });
  });

  if (changed) {
    sourceFile.saveSync();
    filesChanged++;
    console.log(`Updated ${sourceFile.getFilePath()}`);
  }
});

console.log(`\nComplete. Modified ${filesChanged} files.`);
