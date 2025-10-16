#!/usr/bin/env node

/**
 * Health check script for Discharge Summary Generator
 * Tests both frontend and backend services
 */

import http from 'http';

// Test configurations
const tests = [
  {
    name: 'Backend API Server',
    url: 'http://localhost:3001/health',
    expected: 200
  },
  {
    name: 'Frontend Dev Server',
    url: 'http://localhost:5175',
    expected: 200
  }
];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function testEndpoint(test) {
  return new Promise((resolve) => {
    const url = new URL(test.url);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const success = res.statusCode === test.expected;
        resolve({
          ...test,
          status: res.statusCode,
          success,
          data: data.substring(0, 100) // First 100 chars
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        ...test,
        status: 'TIMEOUT',
        success: false,
        error: 'Connection timeout'
      });
    });

    req.on('error', (err) => {
      resolve({
        ...test,
        status: 'ERROR',
        success: false,
        error: err.message
      });
    });

    req.end();
  });
}

async function runHealthCheck() {
  console.log(`${colors.blue}================================${colors.reset}`);
  console.log(`${colors.blue}Discharge Summary Generator${colors.reset}`);
  console.log(`${colors.blue}Health Check${colors.reset}`);
  console.log(`${colors.blue}================================${colors.reset}\n`);

  const results = [];
  
  for (const test of tests) {
    console.log(`Testing ${test.name}...`);
    const result = await testEndpoint(test);
    results.push(result);
    
    if (result.success) {
      console.log(`${colors.green}✓${colors.reset} ${test.name}: ${colors.green}RUNNING${colors.reset} (Status: ${result.status})`);
    } else {
      console.log(`${colors.red}✗${colors.reset} ${test.name}: ${colors.red}DOWN${colors.reset} (${result.error || `Status: ${result.status}`})`);
    }
  }

  console.log('\n' + colors.blue + '================================' + colors.reset);
  
  const allHealthy = results.every(r => r.success);
  
  if (allHealthy) {
    console.log(`${colors.green}✓ All services are healthy!${colors.reset}`);
    console.log('\nApplication is ready at:');
    console.log(`  ${colors.blue}http://localhost:5175${colors.reset}`);
    console.log('\nAPI Keys configured in backend/.env:');
    console.log('  - ANTHROPIC_API_KEY');
    console.log('  - OPENAI_API_KEY');
    console.log('  - GEMINI_API_KEY');
  } else {
    console.log(`${colors.red}✗ Some services are not responding${colors.reset}`);
    console.log('\nTroubleshooting:');
    
    const backendDown = !results.find(r => r.name === 'Backend API Server')?.success;
    const frontendDown = !results.find(r => r.name === 'Frontend Dev Server')?.success;
    
    if (backendDown) {
      console.log(`\n${colors.yellow}Backend server is down. To start:${colors.reset}`);
      console.log('  cd backend && npm start');
    }
    
    if (frontendDown) {
      console.log(`\n${colors.yellow}Frontend server is down. To start:${colors.reset}`);
      console.log('  npm run dev');
    }
  }
  
  console.log(`${colors.blue}================================${colors.reset}\n`);
  
  process.exit(allHealthy ? 0 : 1);
}

// Run the health check
runHealthCheck().catch(err => {
  console.error(`${colors.red}Health check failed:${colors.reset}`, err);
  process.exit(1);
});