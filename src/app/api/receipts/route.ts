import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  //const file = formData.get("file") as File | null;
  const amount = parseFloat(formData.get("amount") as string);
  const fuelType = formData.get("fuelType") as string;
  const stationName = formData.get("stationName") as string;
  const date = new Date(formData.get("date") as string);

  const receipt = await prisma.receipt.create({
    data: {
      userId: session.user.id,
      amount,
      fuelType,
      stationName,
      date: date
    },
  });

  return NextResponse.json(receipt);
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const receipts = await prisma.receipt.findMany({
    where: { userId: session.user.id },
    orderBy: { date: 'desc' },
  });

  return NextResponse.json(receipts);
}