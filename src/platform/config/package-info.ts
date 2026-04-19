import fs from 'node:fs';
import path from 'node:path';

interface PackageInfo {
  description: string;
  version: string;
}

let cachedPackageInfo: PackageInfo | null = null;

export function getPackageInfo(): PackageInfo {
  if (cachedPackageInfo) {
    return cachedPackageInfo;
  }

  const packageJsonPath = path.resolve(__dirname, '../../../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as PackageInfo;
  cachedPackageInfo = {
    description: packageJson.description,
    version: packageJson.version,
  };

  return cachedPackageInfo;
}
