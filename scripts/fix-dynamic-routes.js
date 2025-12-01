const fs = require('fs');
const path = require('path');

// Liste des fichiers qui utilisent auth() mais n'ont pas encore dynamic export
const filesToFix = [
  'app/api/ai-planner/route.ts',
  'app/api/speech-to-text/route.ts',
  'app/api/task-completion/route.ts',
  'app/api/user-memory/route.ts',
  'app/api/stripe/create-checkout/route.ts',
  'app/api/chat/route_old.ts',
  'app/api/conversations/route.ts',
  'app/api/tts/route.ts',
  'app/api/conversations/[id]/messages/route.ts',
  'app/api/subscription/claim-premium-bonus/route.ts',
  'app/api/stripe/portal/route.ts',
  'app/api/tasks/route.ts',
  'app/api/badges/route.ts',
  'app/api/setup-badges/route.ts',
  'app/api/badges/check-daily/route.ts',
  'app/api/parse-task/route.ts',
  'app/api/ai-project-planner/route.ts',
  'app/api/project-steps/[id]/copy-to-tasks/route.ts',
  'app/api/projects/route.ts',
  'app/api/ai-project-chat/route.ts',
  'app/api/parse-project/route.ts',
  'app/api/project-steps/route.ts',
  'app/api/day-planner/route.ts',
  'app/api/user-settings/route.ts',
  'app/api/todo-lists/route.ts',
  'app/api/task-reminders/route.ts',
  'app/api/calendar-notes/[id]/route.ts',
  'app/api/calendar-notes/route.ts',
];

let fixedCount = 0;
let skippedCount = 0;

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${file}`);
      skippedCount++;
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if it already has export const dynamic
    if (content.includes('export const dynamic')) {
      console.log(`⏭️  Already has dynamic export: ${file}`);
      skippedCount++;
      return;
    }

    // Find the last import statement
    const lines = content.split('\n');
    let lastImportIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ') || line.startsWith('} from ')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex === -1) {
      console.log(`⚠️  No import found in: ${file}`);
      skippedCount++;
      return;
    }

    // Insert the dynamic export after the last import
    const dynamicExport = '\n// Force cette route à être dynamique car elle utilise auth()\nexport const dynamic = \'force-dynamic\';';

    lines.splice(lastImportIndex + 1, 0, dynamicExport);
    const newContent = lines.join('\n');

    // Write the updated content back to the file
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    fixedCount++;

  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
    skippedCount++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Fixed: ${fixedCount} files`);
console.log(`   ⏭️  Skipped: ${skippedCount} files`);
