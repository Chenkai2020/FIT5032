/* eslint-env node */
/* global Buffer */
/* global require, exports */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const SG_API_KEY = defineSecret("SG_API_KEY");
const SG_FROM_EMAIL = defineSecret("SG_FROM_EMAIL");

function getUid(req) {
  const uid = req.query.uid || req.query.userId;
  return uid ? String(uid) : null;
}

exports.listMyBookings = onRequest(
  { cors: true, region: "us-central1", timeoutSeconds: 60 },
  async (req, res) => {
    try {
      if (req.method !== "GET") return res.status(405).send("Method Not Allowed");
      const uid = getUid(req);
      if (!uid) return res.status(400).json({ error: "uid_required" });

      const snap = await db
        .collection("bookings")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc")
        .get();

      const items = snap.docs.map((d) => {
        const x = d.data();
        return {
          bookingId: d.id,
          eventTitle: x.eventTitle || "",
          eventFrom: x.eventFrom || "",
          eventTo: x.eventTo || "",
          eventWhere: x.eventWhere || "",
          name: x.name || "",
          email: x.email || "",
          level: x.level || "",
          createdAt:
            x.createdAt && x.createdAt.toDate
              ? x.createdAt.toDate().toISOString()
              : "",
        };
      });

      res.json({ items });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "internal" });
    }
  }
);

exports.listMyRatings = onRequest(
  { cors: true, region: "us-central1", timeoutSeconds: 60 },
  async (req, res) => {
    try {
      if (req.method !== "GET") return res.status(405).send("Method Not Allowed");
      const uid = getUid(req);
      if (!uid) return res.status(400).json({ error: "uid_required" });

      const cg = db.collectionGroup("ratings");
      const snap = await cg.get();
      const items = [];
      snap.forEach((doc) => {
        if (doc.id === uid) {
          const x = doc.data();
          const parent = doc.ref.parent.parent;
          const eventId = parent ? parent.id : "";
          items.push({ eventId, value: Number(x.value || 0), updatedAt: "" });
        }
      });

      res.json({ items });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "internal" });
    }
  }
);

exports.exportMyBookingsCsv = onRequest(
  { cors: true, region: "us-central1", timeoutSeconds: 60 },
  async (req, res) => {
    try {
      if (req.method !== "GET") return res.status(405).send("Method Not Allowed");
      const uid = getUid(req);
      if (!uid) return res.status(400).send("uid_required");

      const snap = await db
        .collection("bookings")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc")
        .get();

      const headers = [
        "BookingID",
        "Event",
        "From",
        "To",
        "Location",
        "Name",
        "Email",
        "Level",
        "CreatedAt",
      ];
      const rows = snap.docs.map((d) => {
        const x = d.data();
        const cells = [
          d.id,
          x.eventTitle || "",
          x.eventFrom || "",
          x.eventTo || "",
          x.eventWhere || "",
          x.name || "",
          x.email || "",
          x.level || "",
          x.createdAt && x.createdAt.toDate
            ? x.createdAt.toDate().toISOString()
            : "",
        ];
        return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
      });

      const csv = headers.join(",") + "\n" + rows.join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="my-bookings.csv"'
      );
      res.status(200).send(csv);
    } catch (e) {
      console.error(e);
      res.status(500).send("internal");
    }
  }
);

exports.sendBookingEmail = onRequest(
  {
    cors: true,
    region: "us-central1",
    timeoutSeconds: 60,
    secrets: [SG_API_KEY, SG_FROM_EMAIL],
  },
  async (req, res) => {
    try {
      if (req.method === "GET") {
        return res.status(200).json({
          ok: true,
          hint: "Use POST with fields: to, booking",
          sample: {
            to: "you@example.com",
            booking: {
              bookingId: "T123",
              eventTitle: "Demo",
              eventFrom: "2025-10-04 10:00",
              eventTo: "2025-10-04 11:00",
              eventWhere: "Online",
              name: "Alice",
              email: "you@example.com",
              level: "Beginner",
            },
          },
        });
      }
      if (req.method !== "POST")
        return res.status(405).send("Method Not Allowed");

      const apiKey = SG_API_KEY.value();
      const from = SG_FROM_EMAIL.value();

      if (!apiKey) return res.status(500).json({ error: "sendgrid_key_not_set" });
      if (!from) return res.status(500).json({ error: "sendgrid_from_not_set" });

      const { to, booking } = req.body || {};
      if (!to || !booking)
        return res
          .status(400)
          .json({ error: "bad_request_missing_to_or_booking" });

      sgMail.setApiKey(apiKey);

      const headers = [
        "bookingId",
        "eventTitle",
        "eventFrom",
        "eventTo",
        "eventWhere",
        "name",
        "email",
        "level",
      ];
      const row = headers.map((h) => booking[h] ?? "").join(",");
      const csv = [headers.join(","), row].join("\n");
      const attachments = [
        {
          content: Buffer.from(csv, "utf8").toString("base64"),
          filename: `booking_${booking.bookingId || Date.now()}.csv`,
          type: "text/csv",
          disposition: "attachment",
        },
      ];

      const msg = {
        to,
        from,
        subject: "Booking Confirmation",
        text: `Hi ${booking.name || ""}, your booking is confirmed.`,
        html: `<p>Hi ${booking.name || ""}, your booking is confirmed.</p>`,
        attachments,
      };

      const [resp] = await sgMail.send(msg);
      return res.status(200).json({ ok: true, sgStatus: resp.statusCode });
    } catch (e) {
      const detail =
        (e && e.response && e.response.body) || { message: e?.message || String(e) };
      console.error("sendBookingEmail error:", detail);
      return res.status(500).json({ error: "internal", detail });
    }
  }
);
