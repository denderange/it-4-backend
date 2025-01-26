import { PrismaClient, User } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface CreateUserInput {
  email: string;
  password: string;
  name?: string | null;
}

const DEFAULT_PASSWORD = '123';
const hashedDefaultPassword = bcrypt.hashSync(DEFAULT_PASSWORD, 12);

export async function createUserByEmailAndPassword(
  user: CreateUserInput
): Promise<User> {
  return prisma.user.create({
    data: {
      email: user.email,
      password: hashedDefaultPassword,
      name: user.name || null,
    },
  });
}

async function main() {
  console.log('Start seeding...');

  for (let i = 0; i < 30; i++) {
    const fakeUser: CreateUserInput = {
      email: faker.internet.email(),
      password: DEFAULT_PASSWORD,
      name: faker.person.fullName(),
    };

    const user = await createUserByEmailAndPassword(fakeUser);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: faker.date.recent({ days: 10 }),
      },
    });
    console.log(`Created user with id: ${user.id}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
