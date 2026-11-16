import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const android = join(root, 'android');
const packageDir = join(android, 'app', 'src', 'main', 'java', 'com', 'mrcdrnzz', 'dailytracker');
const nativeDir = join(root, 'native');
const metadata = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const appGradlePath = join(android, 'app', 'build.gradle');
let appGradle = await readFile(appGradlePath, 'utf8');
appGradle = appGradle.replace(/versionCode\s+\d+/, 'versionCode 39')
  .replace(/versionName\s+"[^"]+"/, `versionName "${metadata.version}"`);
await writeFile(appGradlePath, appGradle);

const variables = join(android, 'variables.gradle');
let gradle = await readFile(variables, 'utf8');
const updated = gradle.replace(/(minSdkVersion\s*=\s*)\d+/, (_match, prefix) => `${prefix}26`);
if (updated === gradle && !/minSdkVersion\s*=\s*26/.test(gradle)) throw new Error('minSdkVersion was not found');
await writeFile(variables, updated);

await mkdir(packageDir, { recursive: true });
for (const name of [
  'MainActivity.java', 'HealthConnectNativePlugin.java', 'PermissionsRationaleActivity.java',
  'HeartRateMeasurement.java', 'HeartRateMetrics.java', 'HeartRateDatabase.java', 'HeartRateDeviceScanner.java',
  'HeartRateService.java', 'HeartRateNativePlugin.java',
]) await copyFile(join(nativeDir, name), join(packageDir, basename(name)));

const drawable = join(android, 'app', 'src', 'main', 'res', 'drawable');
await mkdir(drawable, { recursive: true });
await copyFile(join(nativeDir, 'ic_stat_heart_rate.xml'), join(drawable, 'ic_stat_heart_rate.xml'));

const manifest = join(android, 'app', 'src', 'main', 'AndroidManifest.xml');
let xml = await readFile(manifest, 'utf8');
const permissions = `
    <uses-feature android:name="android.hardware.bluetooth_le" android:required="false" />
    <uses-permission android:name="android.permission.BLUETOOTH" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />
    <uses-permission android:name="android.permission.health.READ_STEPS" />
    <uses-permission android:name="android.permission.health.READ_SLEEP" />
    <uses-permission android:name="android.permission.health.READ_HEART_RATE" />
    <uses-permission android:name="android.permission.health.READ_ACTIVE_CALORIES_BURNED" />
`;
const components = `
        <service android:name=".HeartRateService" android:exported="false" android:foregroundServiceType="connectedDevice" />
        <activity android:name=".PermissionsRationaleActivity" android:exported="true" />
        <activity-alias android:name="ViewPermissionUsageActivity" android:exported="true"
            android:targetActivity=".PermissionsRationaleActivity" android:permission="android.permission.START_VIEW_PERMISSION_USAGE">
            <intent-filter>
                <action android:name="android.intent.action.VIEW_PERMISSION_USAGE" />
                <category android:name="android.intent.category.HEALTH_PERMISSIONS" />
            </intent-filter>
        </activity-alias>
`;
if (!xml.includes('android.permission.BLUETOOTH_SCAN')) xml = xml.replace(/\s*<application/, `\n${permissions}\n    <application`);
if (!xml.includes('.HeartRateService')) xml = xml.replace(/\s*<\/application>/, `\n${components}\n    </application>`);
xml = xml.replace('android:allowBackup="true"', 'android:allowBackup="false"');
await writeFile(manifest, xml);

const icon = join(root, 'www', 'icon-512.png');
for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
  const dir = join(android, 'app', 'src', 'main', 'res', `mipmap-${density}`);
  await mkdir(dir, { recursive: true });
  for (const name of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) await copyFile(icon, join(dir, name));
}

const values = join(android, 'app', 'src', 'main', 'res', 'values');
await mkdir(values, { recursive: true });
await writeFile(join(values, 'ic_launcher_background.xml'), '<?xml version="1.0" encoding="utf-8"?>\n<resources><color name="ic_launcher_background">#08090A</color></resources>\n');

const main = await readFile(join(packageDir, 'MainActivity.java'), 'utf8');
if (!main.includes('registerPlugin(HeartRateNativePlugin.class)')) throw new Error('HeartRateNative plugin is not registered');
console.log('Prepared Capacitor Android project with durable heart-rate bridge.');
