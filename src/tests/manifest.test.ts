/**
 * Manifest validation tests for Chrome Extension
 * Validates that all required permissions, commands, and configurations are present
 */

// Read manifest.json file
import { readFileSync } from 'fs';
import { join } from 'path';

interface ManifestTest {
  name: string;
  passed: boolean;
  error?: string;
}

class ManifestValidator {
  private tests: ManifestTest[] = [];
  private manifest: any;

  constructor(manifestPath: string) {
    try {
      const manifestContent = readFileSync(manifestPath, 'utf-8');
      this.manifest = JSON.parse(manifestContent);
    } catch (error) {
      throw new Error(`Failed to load manifest: ${error}`);
    }
  }

  test(name: string, fn: () => void): void {
    try {
      fn();
      this.tests.push({ name, passed: true });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.tests.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error)
      });
      console.error(`❌ ${name}: ${error}`);
    }
  }

  assert(condition: boolean, message: string): void {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertEqual(actual: any, expected: any, message?: string): void {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertContains(array: any[], item: any, message?: string): void {
    if (!array.includes(item)) {
      throw new Error(message || `Expected array to contain ${item}`);
    }
  }

  assertProperty(obj: any, property: string, message?: string): void {
    if (!(property in obj)) {
      throw new Error(message || `Expected object to have property ${property}`);
    }
  }

  getResults(): { passed: number; failed: number; total: number } {
    const passed = this.tests.filter(t => t.passed).length;
    const failed = this.tests.filter(t => !t.passed).length;
    return { passed, failed, total: this.tests.length };
  }

  printSummary(): void {
    const results = this.getResults();
    console.log('\n📊 Manifest Validation Summary:');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📝 Total: ${results.total}`);
    
    if (results.failed > 0) {
      console.log('\nFailed Tests:');
      this.tests.filter(t => !t.passed).forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }
  }

  // Validation methods
  validateBasicStructure(): void {
    this.test('Manifest has correct version', () => {
      this.assertEqual(this.manifest.manifest_version, 3, 'Should use Manifest V3');
    });

    this.test('Manifest has required basic fields', () => {
      this.assertProperty(this.manifest, 'name', 'Should have name field');
      this.assertProperty(this.manifest, 'version', 'Should have version field');
      this.assertProperty(this.manifest, 'description', 'Should have description field');
      
      this.assert(this.manifest.name.length > 0, 'Name should not be empty');
      this.assert(this.manifest.version.length > 0, 'Version should not be empty');
      this.assert(this.manifest.description.length > 0, 'Description should not be empty');
    });
  }

  validatePermissions(): void {
    this.test('Has all required permissions', () => {
      this.assertProperty(this.manifest, 'permissions', 'Should have permissions array');
      
      const requiredPermissions = [
        'activeTab',
        'storage', 
        'contextMenus',
        'scripting',
        'notifications'
      ];
      
      requiredPermissions.forEach(permission => {
        this.assertContains(
          this.manifest.permissions, 
          permission, 
          `Should have ${permission} permission`
        );
      });
    });

    this.test('Permissions are minimal and necessary', () => {
      const permissions = this.manifest.permissions;
      
      // Check for potentially dangerous permissions that shouldn't be there
      const dangerousPermissions = [
        'tabs', // We use activeTab instead
        '<all_urls>', // Too broad
        'background', // Not needed in MV3
        'bookmarks',
        'history',
        'management'
      ];
      
      dangerousPermissions.forEach(permission => {
        this.assert(
          !permissions.includes(permission),
          `Should not have dangerous permission: ${permission}`
        );
      });
    });
  }

  validateCommands(): void {
    this.test('Has required keyboard commands', () => {
      this.assertProperty(this.manifest, 'commands', 'Should have commands object');
      
      const commands = this.manifest.commands;
      this.assertProperty(commands, 'quick-save', 'Should have quick-save command');
      this.assertProperty(commands, 'save-with-notes', 'Should have save-with-notes command');
    });

    this.test('Commands have proper key bindings', () => {
      const commands = this.manifest.commands;
      
      // Validate quick-save command
      const quickSave = commands['quick-save'];
      this.assertProperty(quickSave, 'suggested_key', 'quick-save should have suggested_key');
      this.assertProperty(quickSave.suggested_key, 'default', 'Should have default key binding');
      this.assertProperty(quickSave.suggested_key, 'mac', 'Should have Mac key binding');
      
      this.assertEqual(quickSave.suggested_key.default, 'Ctrl+Shift+S');
      this.assertEqual(quickSave.suggested_key.mac, 'Command+Shift+S');
      
      // Validate save-with-notes command
      const saveWithNotes = commands['save-with-notes'];
      this.assertProperty(saveWithNotes, 'suggested_key', 'save-with-notes should have suggested_key');
      this.assertEqual(saveWithNotes.suggested_key.default, 'Ctrl+Shift+D');
      this.assertEqual(saveWithNotes.suggested_key.mac, 'Command+Shift+D');
    });

    this.test('Commands have descriptions', () => {
      const commands = this.manifest.commands;
      
      Object.keys(commands).forEach(commandKey => {
        const command = commands[commandKey];
        this.assertProperty(command, 'description', `${commandKey} should have description`);
        this.assert(command.description.length > 0, `${commandKey} description should not be empty`);
      });
    });
  }

  validateOmnibox(): void {
    this.test('Has omnibox configuration', () => {
      this.assertProperty(this.manifest, 'omnibox', 'Should have omnibox configuration');
      this.assertProperty(this.manifest.omnibox, 'keyword', 'Should have omnibox keyword');
      this.assertEqual(this.manifest.omnibox.keyword, 'tana', 'Omnibox keyword should be "tana"');
    });
  }

  validateAction(): void {
    this.test('Has proper action configuration', () => {
      this.assertProperty(this.manifest, 'action', 'Should have action configuration');
      
      const action = this.manifest.action;
      this.assertProperty(action, 'default_popup', 'Should have default popup');
      this.assertProperty(action, 'default_icon', 'Should have default icon');
      
      this.assertEqual(action.default_popup, 'popup.html');
      
      // Validate icon sizes
      const requiredIconSizes = ['16', '48', '128'];
      requiredIconSizes.forEach(size => {
        this.assertProperty(action.default_icon, size, `Should have ${size}px icon`);
        this.assert(
          action.default_icon[size].includes('icon' + size),
          `Icon ${size} should reference correct file`
        );
      });
    });
  }

  validateBackground(): void {
    this.test('Has proper background script configuration', () => {
      this.assertProperty(this.manifest, 'background', 'Should have background configuration');
      
      const background = this.manifest.background;
      this.assertProperty(background, 'service_worker', 'Should have service_worker');
      this.assertProperty(background, 'type', 'Should have type');
      
      this.assertEqual(background.service_worker, 'background.js');
      this.assertEqual(background.type, 'module');
    });
  }

  validateContentScripts(): void {
    this.test('Has proper content script configuration', () => {
      this.assertProperty(this.manifest, 'content_scripts', 'Should have content_scripts array');
      
      const contentScripts = this.manifest.content_scripts;
      this.assert(Array.isArray(contentScripts), 'content_scripts should be an array');
      this.assert(contentScripts.length > 0, 'Should have at least one content script');
      
      const mainContentScript = contentScripts[0];
      this.assertProperty(mainContentScript, 'matches', 'Content script should have matches');
      this.assertProperty(mainContentScript, 'js', 'Content script should have js files');
      
      this.assertContains(mainContentScript.matches, '<all_urls>', 'Should match all URLs');
      this.assertContains(mainContentScript.js, 'content.js', 'Should include content.js');
    });
  }

  validateIcons(): void {
    this.test('Has proper icon configuration', () => {
      this.assertProperty(this.manifest, 'icons', 'Should have icons configuration');
      
      const icons = this.manifest.icons;
      const requiredIconSizes = ['16', '48', '128'];
      
      requiredIconSizes.forEach(size => {
        this.assertProperty(icons, size, `Should have ${size}px icon`);
        this.assert(
          icons[size].includes('icon' + size),
          `Icon ${size} should reference correct file`
        );
        this.assert(
          icons[size].includes('.png'),
          `Icon ${size} should be PNG format`
        );
      });
    });
  }

  validateOptionsPage(): void {
    this.test('Has options page configuration', () => {
      this.assertProperty(this.manifest, 'options_page', 'Should have options_page');
      this.assertEqual(this.manifest.options_page, 'options.html');
    });
  }

  validateVersion(): void {
    this.test('Has valid version format', () => {
      const version = this.manifest.version;
      const versionRegex = /^\d+\.\d+\.\d+$/;
      
      this.assert(
        versionRegex.test(version),
        `Version should be in format x.y.z, got ${version}`
      );
    });
  }

  validateSecurityConsiderations(): void {
    this.test('Follows security best practices', () => {
      // Check that we don't have overly broad permissions
      if (this.manifest.permissions) {
        this.assert(
          !this.manifest.permissions.includes('tabs'),
          'Should use activeTab instead of tabs permission'
        );
      }
      
      // Check that content scripts are not too broad
      if (this.manifest.content_scripts) {
        this.manifest.content_scripts.forEach((script: any, index: number) => {
          if (script.matches && script.matches.includes('<all_urls>')) {
            // This is acceptable for our use case, but we should ensure run_at is appropriate
            this.assert(
              !script.run_at || script.run_at === 'document_end' || script.run_at === 'document_idle',
              `Content script ${index} should run at appropriate time`
            );
          }
        });
      }
    });
  }

  validateManifestIntegrity(): void {
    this.test('Manifest JSON is valid and well-formed', () => {
      // Test was already done in constructor by successful parsing
      this.assert(this.manifest !== null, 'Manifest should be valid JSON');
      this.assert(typeof this.manifest === 'object', 'Manifest should be an object');
    });

    this.test('Has no conflicting configurations', () => {
      // Check for potential conflicts
      if (this.manifest.background) {
        this.assert(
          !this.manifest.background.scripts,
          'Should not have both service_worker and scripts in background'
        );
        
        this.assert(
          !this.manifest.background.persistent,
          'MV3 service workers should not have persistent property'
        );
      }
    });
  }

  validateExtensionSpecificRequirements(): void {
    this.test('Extension name and description are appropriate', () => {
      this.assert(
        this.manifest.name.toLowerCase().includes('tana'),
        'Extension name should reference Tana'
      );
      
      this.assert(
        this.manifest.description.toLowerCase().includes('tana'),
        'Extension description should reference Tana'
      );
    });

    this.test('Version is appropriate for feature set', () => {
      const version = this.manifest.version;
      const [major, minor, patch] = version.split('.').map(Number);
      
      // Since this is an enhanced version with new features, it should be at least 1.1.0
      this.assert(
        major >= 1 && (minor >= 1 || patch > 0),
        'Version should reflect enhanced functionality'
      );
    });
  }

  // Run all validations
  runAllValidations(): void {
    console.log('🔍 Validating Chrome Extension Manifest\n');
    
    this.validateBasicStructure();
    this.validatePermissions();
    this.validateCommands();
    this.validateOmnibox();
    this.validateAction();
    this.validateBackground();
    this.validateContentScripts();
    this.validateIcons();
    this.validateOptionsPage();
    this.validateVersion();
    this.validateSecurityConsiderations();
    this.validateManifestIntegrity();
    this.validateExtensionSpecificRequirements();
    
    this.printSummary();
  }
}

// Run manifest validation
try {
  // Try multiple possible paths for the manifest
  const possiblePaths = [
    join(process.cwd(), 'static', 'manifest.json'),
    join(process.cwd(), 'dist', 'manifest.json'),
    join(process.cwd(), 'manifest.json')
  ];
  
  let manifestPath = '';
  for (const path of possiblePaths) {
    try {
      readFileSync(path);
      manifestPath = path;
      break;
    } catch {
      // Try next path
    }
  }
  
  if (!manifestPath) {
    throw new Error('Could not find manifest.json in any expected location');
  }
  
  console.log(`📋 Found manifest at: ${manifestPath}\n`);
  
  const validator = new ManifestValidator(manifestPath);
  validator.runAllValidations();
  
} catch (error) {
  console.error('❌ Manifest validation failed:', error);
  process.exit(1);
}

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ManifestValidator };
}