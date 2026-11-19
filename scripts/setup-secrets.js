const fs = require('fs');
const path = require('path');

const secretPath = path.resolve(__dirname, '../environments/secret.ts');

const envKey =
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.googleMapsApiKey ||
  process.env.googleApiKey ||
  process.env.GOOGLE_API_KEY ||
  '';

let existingKey = '';
if (fs.existsSync(secretPath)) {
  try {
    const content = fs.readFileSync(secretPath, 'utf8');
    const match = content.match(/googleMapsApiKey:\s*['"`]([^'"`]*)['"`]/);
    if (match && match[1]) {
      existingKey = match[1];
    }
  } catch (err) {
    // ignore read error
  }
}

const finalKey = envKey || existingKey || '';

const fileContent = `export const secrets = {\n  googleMapsApiKey: '${finalKey}',\n};\n`;

fs.writeFileSync(secretPath, fileContent, 'utf8');
console.log(`[setup-secrets] Generated secret.ts with key: ${finalKey ? (finalKey.substring(0, 8) + '...') : '(none provided)'}`);
