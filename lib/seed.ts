import "dotenv/config"

import bcrypt from "bcryptjs"
import mongoose from "mongoose"

import { env } from "@/lib/env"
import { connectDB } from "@/lib/mongodb"
import { Lotissement, User } from "@/models"

export async function main() {
  await connectDB()

  const lotissements = [
    {
      name: "Domaine Bel Air Masindray",
      location: "Masindray, Antananarivo",
      description: "Description du domaine Bel Air",
      googleMapLink: "https://maps.google.com/?q=Masindray",
      images: [],
    },
    {
      name: "Belle Vue Ambohijanaka Ambohimahitsy",
      location: "Ambohijanaka, Ambohimahitsy",
      description: "Description Belle Vue",
      googleMapLink: "https://maps.google.com/?q=Ambohijanaka",
      images: [],
    },
    {
      name: "Domaine Fanirisoa Imerintsiatosika",
      location: "Imerintsiatosika, Antananarivo",
      description: "Description Fanirisoa",
      googleMapLink: "https://maps.google.com/?q=Imerintsiatosika",
      images: [],
    },
  ]

  for (const data of lotissements) {
    await Lotissement.findOneAndUpdate({ name: data.name }, data, {
      upsert: true,
      new: true,
    })
  }

  const existingAdmin = await User.findOne({ role: "admin" })

  if (!existingAdmin) {
    const password = "Admin@1234!"
    const hashedPassword = await bcrypt.hash(password, 12)

    const adminEmail = "admin@soajery.mg"

    const admin = await User.create({
      name: "Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    })

    console.log("Seeded admin user:")
    console.log(`- email: ${adminEmail}`)
    console.log(`- password: ${password}`)
    console.warn("Change this password immediately after first login.")
    console.log(`MVOLA merchant phone configured: ${env.MVOLA_MERCHANT_PHONE}`)
    console.log(`Admin id: ${admin._id.toString()}`)
  }
}

void main()
  .then(() => {
    console.log("Seed completed")
  })
  .catch((error) => {
    console.error("Seed failed", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
    process.exit(process.exitCode ?? 0)
  })
