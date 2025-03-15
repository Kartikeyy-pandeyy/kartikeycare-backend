const express = require("express");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const QRCode = require("qrcode");
const Appointment = require("../models/appointmentModel");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Generate OPD Ticket PDF (GET request)
router.get("/generate-ticket/:ticketId", async (req, res) => {
  try {
    const { ticketId } = req.params;
    console.log("Received request for ticket:", ticketId);

    // Fetch appointment details from MongoDB
    const appointment = await Appointment.findOne({ ticketId });
    if (!appointment) {
      console.log("❌ Ticket not found in database:", ticketId);
      return res.status(404).json({ error: "Appointment not found" });
    }
    console.log("✅ Appointment found:", appointment);

    const { name, age, phone, address, department, date, slot } = appointment;

    // Generate QR Code as Base64 Data URL
    const qrCodeDataUrl = await QRCode.toDataURL(ticketId, { margin: 2, width: 140, color: { dark: "#0066CC", light: "#FFFFFF" } });

    // Create PDF Document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 850]); // A4-like size
    const { width, height } = page.getSize();

    // Embed Fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Background Image (Watermark)
    const backgroundImagePath = path.join(__dirname, "../assets/kartikey.png");
    const backgroundImageBytes = fs.readFileSync(backgroundImagePath);
    const backgroundImage = await pdfDoc.embedPng(backgroundImageBytes);
    page.drawImage(backgroundImage, { x: 0, y: 0, width, height, opacity: 0.1 });

    // Header Banner (Simulated Gradient)
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width,
      height: 100,
      color: rgb(0, 0.4, 0.8), // Deep blue
      opacity: 0.9,
    });
    page.drawRectangle({
      x: 0,
      y: height - 70,
      width,
      height: 30,
      color: rgb(0.2, 0.6, 1), // Lighter blue
      opacity: 0.7,
    });

    // Header Text
    const headerText = "Kartikey Care OPD Ticket";
    const headerTextWidth = helveticaBold.widthOfTextAtSize(headerText, 28);
    page.drawText(headerText, {
      x: (width - headerTextWidth) / 2,
      y: height - 55,
      size: 28,
      font: helveticaBold,
      color: rgb(1, 1, 1), // White
      opacity: 1,
    });

    // Main Content Box
    page.drawRectangle({
      x: 30,
      y: 150,
      width: width - 60,
      height: height - 300,
      borderWidth: 1,
      borderColor: rgb(0, 0.4, 0.8),
      color: rgb(1, 1, 1),
      opacity: 0.05,
    });

    // User Details Section
    const details = [
      `Name: ${name}`,
      `Age: ${age}`,
      `Phone: ${phone}`,
      `Address: ${address}`,
      `Department: ${department}`,
      `Date: ${date}`,
      `Slot: ${slot}`,
      `Ticket ID: ${ticketId}`,
    ];

    let yPosition = height - 130;
    page.drawText("Patient Details", {
      x: 50,
      y: yPosition,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0.4, 0.8),
    });

    yPosition -= 30;
    details.forEach((text, index) => {
      page.drawText(text, {
        x: 50,
        y: yPosition,
        size: 14,
        font: helvetica,
        color: rgb(0, 0, 0),
      });
      yPosition -= 25;
      if (index === 3) yPosition -= 20; // Extra spacing after Address
    });

    // QR Code Section
    const qrImage = await pdfDoc.embedPng(qrCodeDataUrl);
    page.drawRectangle({
      x: 380,
      y: height - 260,
      width: 180,
      height: 180,
      borderWidth: 2,
      borderColor: rgb(0, 0.4, 0.8),
      opacity: 0.1,
    });
    page.drawImage(qrImage, {
      x: 400,
      y: height - 240,
      width: 140,
      height: 140,
    });
    page.drawText("Scan for Verification", {
      x: 400,
      y: height - 270,
      size: 12,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Vertical Divider
    page.drawLine({
      start: { x: 360, y: height - 120 },
      end: { x: 360, y: yPosition + 20 },
      thickness: 1.5,
      color: rgb(0, 0.4, 0.8),
      opacity: 0.8,
    });

    // General Advice Section
    const advice = [
      "• Arrive 15 minutes before your slot.",
      "• Bring ID proof and medical records.",
      "• Follow social distancing & COVID guidelines.",
      "• Contact reception for assistance.",
      "• Thank you for choosing Kartikey Care!",
    ];

    page.drawText("Visit Guidelines", {
      x: 50,
      y: yPosition - 20,
      size: 16,
      font: helveticaBold,
      color: rgb(0, 0.4, 0.8),
    });

    yPosition -= 40;
    advice.forEach((text) => {
      page.drawText(text, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helvetica,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPosition -= 20;
    });

    // Footer
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height: 80,
      color: rgb(0.9, 0.9, 0.9),
      opacity: 0.8,
    });
    page.drawText("Kartikey Care Hospital - Gorakhpur", {
      x: 50,
      y: 50,
      size: 12,
      font: helveticaBold,
      color: rgb(0, 0.4, 0.8),
    });
    page.drawText("Contact: +91 7388109688 | kartikeycare.vercel.app", {
      x: 50,
      y: 30,
      size: 10,
      font: helvetica,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Decorative Elements
    page.drawLine({
      start: { x: 30, y: height - 100 },
      end: { x: width - 30, y: height - 100 },
      thickness: 1,
      color: rgb(0, 0.4, 0.8),
      opacity: 0.5,
    });
    page.drawLine({
      start: { x: 30, y: 80 },
      end: { x: width - 30, y: 80 },
      thickness: 1,
      color: rgb(0, 0.4, 0.8),
      opacity: 0.5,
    });

    // Save and Send PDF
    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Disposition", `attachment; filename=OPD_Ticket_${ticketId}.pdf`);
    res.setHeader("Content-Type", "application/pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    console.error("❌ Error generating OPD Ticket PDF:", error);
    res.status(500).json({ error: "Failed to generate OPD Ticket" });
  }
});

module.exports = router;