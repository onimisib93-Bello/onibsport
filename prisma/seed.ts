import { PrismaClient, ArticleStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { categories } from "../src/lib/data/categories";
import { articles } from "../src/lib/data/articles";

const prisma = new PrismaClient();

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, shortName: c.shortName, accent: c.accent },
      create: c,
    });
  }

  for (const a of articles) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: a.category } });
    await prisma.article.upsert({
      where: { slug: a.slug },
      update: { coverImage: a.coverImage },
      create: {
        slug: a.slug,
        title: a.title,
        dek: a.dek,
        body: a.body.join("\n\n"),
        image: a.image,
        imageAlt: a.imageAlt,
        coverImage: a.coverImage,
        author: a.author,
        source: a.source,
        tags: a.tags.join(", "),
        isBreaking: !!a.isBreaking,
        featuredVideoUrl: a.featuredVideoUrl,
        status: a.status.toUpperCase() as ArticleStatus,
        categoryId: category.id,
        publishedAt: new Date(a.publishedAt),
      },
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { passwordHash },
      create: { email: adminEmail, passwordHash },
    });
    console.log(`Admin user ready: ${adminEmail}`);
  } else {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipped admin user creation.");
  }

  console.log(`Seeded ${categories.length} categories and ${articles.length} articles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
