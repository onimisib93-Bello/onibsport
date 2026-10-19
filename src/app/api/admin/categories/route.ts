import { NextResponse } from "next/server";
import { ensureCategories } from "@/lib/data/ensureCategories";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await ensureCategories();
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ categories });
}
