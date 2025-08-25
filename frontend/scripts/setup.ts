#!/usr/bin/env bun

import { execSync } from 'child_process';
import { prisma } from '../lib/db';


console.log('🚀 Setting up PDF RAG application...');

// Generate Prisma client
console.log('📦 Generating Prisma client...');
try {
  execSync('bunx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error);
  process.exit(1);
}

// Run database migrations
console.log('🗄️ Running database migrations...');
try {
  execSync('bunx prisma db push', { stdio: 'inherit' });
  console.log('✅ Database migrations completed');
} catch (error) {
  console.error('❌ Failed to run database migrations:', error);
  process.exit(1);
}

// Start the queue worker


console.log('✅ Setup completed successfully!');
console.log('🎯 You can now start the development server with: bun run dev');
