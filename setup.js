#!/usr/bin/env node

/**
 * Setup Script for Capacity Chemical AI Chatbot
 * 
 * This script helps configure the initial setup for Supabase integration
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Welcome to Capacity Chemical AI Chatbot Setup!\n');

const questions = [
  {
    key: 'supabaseUrl',
    question: 'Enter your Supabase Project URL: ',
    default: 'https://qxumycaclvunxqqdooio.supabase.co'
  },
  {
    key: 'supabaseAnonKey',
    question: 'Enter your Supabase Anon Key: ',
    default: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4dW15Y2FjbHZ1bnhxcWRvb2lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNTc0MTMsImV4cCI6MjA3ODkzMzQxM30.XDnx99GhsAZGOILt4OBR90gvfGgsol-4DztApP1uN8c'
  }
];

async function askQuestion(question, defaultValue) {
  return new Promise((resolve) => {
    rl.question(`${question}(${defaultValue}): `, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function updateEnvironmentFiles(config) {
  const envTemplate = `export const environment = {
  production: false,
  supabase: {
    url: '${config.supabaseUrl}',
    anonKey: '${config.supabaseAnonKey}',
  },
};
`;

  const envProdTemplate = `export const environment = {
  production: true,
  supabase: {
    url: '${config.supabaseUrl}',
    anonKey: '${config.supabaseAnonKey}',
  },
};
`;

  try {
    // Update development environment
    fs.writeFileSync(
      path.join(__dirname, 'src', 'environments', 'environment.ts'),
      envTemplate
    );

    // Update production environment
    fs.writeFileSync(
      path.join(__dirname, 'src', 'environments', 'environment.prod.ts'),
      envProdTemplate
    );

    console.log('✅ Environment files updated successfully!');
  } catch (error) {
    console.error('❌ Error updating environment files:', error.message);
  }
}

async function checkDependencies() {
  console.log('\n📦 Checking dependencies...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = {
    '@supabase/supabase-js': '^2.81.1',
    'rxjs': '~7.8.0'
  };

  const missingDeps = [];
  
  for (const [dep, version] of Object.entries(requiredDeps)) {
    if (!packageJson.dependencies[dep]) {
      missingDeps.push(`${dep}@${version}`);
    }
  }

  if (missingDeps.length > 0) {
    console.log('⚠️  Missing dependencies:', missingDeps.join(', '));
    console.log('💡 Run: npm install ' + missingDeps.join(' '));
  } else {
    console.log('✅ All required dependencies are installed');
  }
}

async function displayNextSteps() {
  console.log('\n🎉 Setup completed successfully!\n');
  console.log('📋 Next Steps:');
  console.log('1. 📊 Set up your Supabase database:');
  console.log('   - Open your Supabase dashboard');
  console.log('   - Run the SQL migrations from DATABASE_SETUP.md');
  console.log('');
  console.log('2. 🔐 Configure OAuth (optional):');
  console.log('   - Set up Microsoft Azure OAuth in Supabase');
  console.log('   - Add redirect URLs for your application');
  console.log('');
  console.log('3. 🚀 Start the application:');
  console.log('   - npm start');
  console.log('   - Open http://localhost:4200');
  console.log('');
  console.log('4. 🧪 Test the integration:');
  console.log('   - Follow the TESTING_GUIDE.md for comprehensive testing');
  console.log('');
  console.log('📚 Additional Resources:');
  console.log('   - DATABASE_SETUP.md - Database schema and migrations');
  console.log('   - TESTING_GUIDE.md - Complete testing procedures');
  console.log('   - SUPABASE_INTEGRATION.md - Integration documentation');
}

async function main() {
  try {
    const config = {};
    
    for (const question of questions) {
      config[question.key] = await askQuestion(question.question, question.default);
    }

    console.log('\n🔧 Configuring environment files...');
    await updateEnvironmentFiles(config);
    
    await checkDependencies();
    await displayNextSteps();

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the setup
main();
