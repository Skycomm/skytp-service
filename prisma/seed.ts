import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const doctors = [
    {
      name: "Dr Gabriel Lee",
      email: "admin@profglee.com",
      practiceName: "Prof Gabriel Lee - Hollywood Medical Centre",
      preferredModel: "gpt-4.1",
      isAdmin: true,
    },
    {
      name: "Prof Gabriel Lee",
      email: "gabriellee2004@rocketmail.com",
      practiceName: "Prof Gabriel Lee",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Grace Gong",
      email: "allergykidz@outlook.com",
      practiceName: "Dr Grace Gong",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Arul Bala",
      email: "drarulbala@outlook.com",
      practiceName: "Dr Arul Bala",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Patrice Mwipatayi",
      email: "patrice@bibombe.com",
      practiceName: "Dr Mwipatayi",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Adnan Khattak",
      email: "adnan@example.com",
      practiceName: "Dr Khattak",
      preferredModel: "gpt-4.1",
    },
    // Additional doctors from Email Lookup
    {
      name: "Dr Jay Natalwala",
      email: "jay.natalwala@fertilitynorth.com.au",
      practiceName: "Fertility North",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr John Armstrong",
      email: "info@advancesurgical.com.au",
      practiceName: "Advance Surgical",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Paul Yuen",
      email: "paul.yuen@live.com",
      practiceName: "Dr Paul Yuen",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Gian Urbani",
      email: "urbanigian@gmail.com",
      practiceName: "Dr Gian Urbani",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Barton Smith",
      email: "bart.smith@fertilitynorth.com.au",
      practiceName: "Fertility North",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Chinwern Chan",
      email: "cchan89@hotmail.com",
      practiceName: "Dr Chinwern Chan",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Western ENT",
      email: "admin@westernent.com.au",
      practiceName: "Western ENT",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr WA Cardiology",
      email: "claireh@wacardiology.com.au",
      practiceName: "WA Cardiology",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Starhill Medical",
      email: "sganesh@starhillmedical.com.au",
      practiceName: "Starhill Medical",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Five Eight",
      email: "kelly@5859surgicalservices.com",
      practiceName: "58/59 Surgical Services",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Five Nine",
      email: "reception@5859surgicalservices.com",
      practiceName: "58/59 Surgical Services",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Olufemi Oshin",
      email: "oshin@hollywoodvascular.com",
      practiceName: "Hollywood Vascular",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Philippe Giguere-Simmonds",
      email: "philippe.giguere-simmonds@health.wa.gov.au",
      practiceName: "Dr Philippe Giguere-Simmonds",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Tony Ryan",
      email: "tonysonya@gmail.com",
      practiceName: "Dr Tony Ryan",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Dhammika Gunasekara",
      email: "sumuditha@hotmail.com",
      practiceName: "Dr Dhammika Gunasekara",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Charlie Ranaweera",
      email: "ranaweeracb@yahoo.com",
      practiceName: "Dr Charlie Ranaweera",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Andrew Hutchison",
      email: "andrew@thebloodclinic.com",
      practiceName: "The Blood Clinic",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Shane Gangatharan",
      email: "shane@haemclinic.com.au",
      practiceName: "Haem Clinic",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Julian Rodrigues",
      email: "admin@drjulianrodrigues.com.au",
      practiceName: "Dr Julian Rodrigues",
      preferredModel: "gpt-4.1",
    },
    {
      name: "Dr Ron Manasseh",
      email: "rmanasseh@gmail.com",
      practiceName: "Dr Ron Manasseh",
      preferredModel: "gpt-4.1",
    },
  ];

  for (const doc of doctors) {
    await prisma.doctor.upsert({
      where: { email: doc.email },
      update: { name: doc.name, practiceName: doc.practiceName },
      create: doc,
    });
  }

  console.log(`Seeded ${doctors.length} doctors`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
