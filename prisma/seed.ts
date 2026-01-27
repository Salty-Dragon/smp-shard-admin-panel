/**
 * Database Seeder Script
 * Seeds initial roles, permissions, and a Super Admin user
 * 
 * Run with: npx ts-node prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles
  console.log('Creating roles...');
  
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Full access to all features and settings',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Access to all features except logs and permissions management',
    },
  });

  const moderatorRole = await prisma.role.upsert({
    where: { name: 'Moderator' },
    update: {},
    create: {
      name: 'Moderator',
      description: 'Read-only access to logs and dashboard',
    },
  });

  console.log('✓ Roles created');

  // Create permissions for Admin role
  console.log('Creating Admin permissions...');
  
  const adminPermissions = [
    { resource: 'dashboard', action: 'read' },
    { resource: 'dashboard', action: 'write' },
    { resource: 'server', action: 'read' },
    { resource: 'server', action: 'write' },
    { resource: 'server', action: 'manage' },
    { resource: 'users', action: 'read' },
  ];

  for (const perm of adminPermissions) {
    await prisma.permission.upsert({
      where: {
        roleId_resource_action: {
          roleId: adminRole.id,
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        resource: perm.resource,
        action: perm.action,
      },
    });
  }

  console.log('✓ Admin permissions created');

  // Create permissions for Moderator role
  console.log('Creating Moderator permissions...');
  
  const moderatorPermissions = [
    { resource: 'dashboard', action: 'read' },
    { resource: 'logs', action: 'read' },
    { resource: 'server', action: 'read' },
  ];

  for (const perm of moderatorPermissions) {
    await prisma.permission.upsert({
      where: {
        roleId_resource_action: {
          roleId: moderatorRole.id,
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {},
      create: {
        roleId: moderatorRole.id,
        resource: perm.resource,
        action: perm.action,
      },
    });
  }

  console.log('✓ Moderator permissions created');

  // Create default Super Admin user
  console.log('Creating default Super Admin user...');
  
  const defaultPassword = await bcrypt.hash('admin123', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@smp-panel.local' },
    update: {},
    create: {
      email: 'admin@smp-panel.local',
      password: defaultPassword,
      name: 'Super Admin',
      roleId: superAdminRole.id,
      twoFactorEnabled: false,
    },
  });

  console.log('✓ Super Admin user created');
  console.log('\n📧 Default Super Admin credentials:');
  console.log('   Email: admin@smp-panel.local');
  console.log('   Password: admin123');
  console.log('\n⚠️  IMPORTANT: Change the default password after first login!\n');

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
