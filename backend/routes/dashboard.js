const express = require("express");
const pool = require("../db");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const {
  calculateStreak,
  calculateAverageMood,
  buildMoodTrend,
  buildWellbeingTrend,
  detectCrisisKeywords,
} = require("../utils/metrics");
const { describeMood, getMoodScore } = require("../utils/mood");

const router = express.Router();

function parseResponses(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

router.get(
  "/journaler",
  authenticate,
  requireRole("journaler"),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT e.*, f.title AS form_title
         FROM journal_entries e
         JOIN journal_forms f ON f.id = e.form_id
         WHERE e.journaler_id = $1
         ORDER BY e.entry_date DESC, e.created_at DESC
         LIMIT 120`,
        [req.user.id]
      );

      const entries = rows.map((row) => ({
        ...row,
        responses: parseResponses(row.responses),
      }));

      const streak = calculateStreak(entries);
      const averageMood = calculateAverageMood(entries);
      const moodDescriptor = describeMood(averageMood);
      const trend = buildMoodTrend(entries, 21);
      const sleepTrend = buildWellbeingTrend(entries, {
        fieldMatchers: ["sleep quality"],
        valueMap: {
          high: { score: 5, label: "High" },
          medium: { score: 3, label: "Steady" },
          low: { score: 1, label: "Low" },
        },
        limit: 21,
      });
      const energyTrend = buildWellbeingTrend(entries, {
        fieldMatchers: ["energy level"],
        valueMap: {
          high: { score: 5, label: "High" },
          medium: { score: 3, label: "Steady" },
          low: { score: 1, label: "Low" },
        },
        limit: 21,
      });

      const highlights = entries.slice(0, 5).map((row) => ({
        id: row.id,
        entryDate: row.entry_date,
        mood: row.mood,
        summary: row.summary,
        formTitle: row.form_title,
      }));

      const lastEntry = entries.length
        ? {
            entryDate: entries[0].entry_date,
            summary: entries[0].summary,
            sharedLevel: entries[0].shared_level,
            mood: entries[0].mood,
          }
        : null;

      const startDate = entries.length
        ? new Date(entries[entries.length - 1].entry_date)
        : new Date();
      const daysTracked = Math.max(
        1,
        Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      );
      const consistency = Number(
        ((entries.length / daysTracked) * 7).toFixed(2)
      );

      const moodBreakdown = entries.reduce((acc, row) => {
        if (!row.mood) return acc;
        acc[row.mood] = (acc[row.mood] || 0) + 1;
        return acc;
      }, {});

      return res.json({
        streak,
        averageMood,
        moodDescriptor,
        trend,
        sleepTrend,
        energyTrend,
        highlights,
        lastEntry,
        stats: {
          totalEntries: entries.length,
          consistency,
          moodBreakdown,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/mentor",
  authenticate,
  requireRole("mentor"),
  async (req, res, next) => {
    try {
      const { rows: menteeRows } = await pool.query(
        `SELECT ml.journaler_id, j.name, j.email
         FROM mentor_links ml
         JOIN users j ON j.id = ml.journaler_id
         WHERE ml.mentor_id = $1
         ORDER BY j.name`,
        [req.user.id]
      );

      const menteeIds = menteeRows.map((row) => row.journaler_id);

      let entryRows = [];
      if (menteeIds.length) {
        const { rows } = await pool.query(
          `SELECT e.*, f.title AS form_title, j.name AS journaler_name
           FROM journal_entries e
           JOIN journal_forms f ON f.id = e.form_id
           JOIN users j ON j.id = e.journaler_id
           WHERE e.journaler_id = ANY($1::int[]) AND e.shared_level <> 'private'
           ORDER BY e.entry_date DESC, e.created_at DESC`,
          [menteeIds]
        );
        entryRows = rows;
      }

      const entriesByMentee = new Map();
      entryRows.forEach((row) => {
        if (!entriesByMentee.has(row.journaler_id)) {
          entriesByMentee.set(row.journaler_id, []);
        }
        entriesByMentee.get(row.journaler_id).push(row);
      });

      const mentees = menteeRows.map((row) => {
        const entries = entriesByMentee.get(row.journaler_id) || [];
        const averageMood = calculateAverageMood(entries);
        const recentEntries = entries.slice(0, 5).map((entry) => ({
          id: entry.id,
          entryDate: entry.entry_date,
          mood: entry.mood,
          summary: entry.summary,
          sharedLevel: entry.shared_level,
        }));

        const lowMoodFlags = entries.filter((entry) => {
          const score = getMoodScore(entry.mood);
          return typeof score === "number" && score <= 2;
        });

        const crisisFlags = entries.filter((entry) =>
          detectCrisisKeywords(parseResponses(entry.responses), entry.summary)
        );

        return {
          id: row.journaler_id,
          name: row.name,
          email: row.email,
          averageMood,
          trend: buildMoodTrend(entries, 14),
          recentEntries,
          alerts: {
            lowMood: lowMoodFlags.map((entry) => ({
              id: entry.id,
              entryDate: entry.entry_date,
              mood: entry.mood,
            })),
            crisis: crisisFlags.map((entry) => ({
              id: entry.id,
              entryDate: entry.entry_date,
              summary: entry.summary,
            })),
          },
        };
      });

      const { rows: pendingRequests } = await pool.query(
        `SELECT COUNT(*) FROM mentor_requests WHERE mentor_id = $1 AND status = 'pending'`,
        [req.user.id]
      );

      const { rows: unreadNotifications } = await pool.query(
        `SELECT COUNT(*) FROM mentor_notifications WHERE mentor_id = $1 AND read_at IS NULL`,
        [req.user.id]
      );

      const recentEntries = entryRows.slice(0, 8).map((entry) => ({
        id: entry.id,
        journalerId: entry.journaler_id,
        journalerName: entry.journaler_name,
        entryDate: entry.entry_date,
        mood: entry.mood,
        summary: entry.summary,
        sharedLevel: entry.shared_level,
      }));

      return res.json({
        overview: {
          menteeCount: mentees.length,
          pendingRequests: Number(pendingRequests[0]?.count || 0),
          unreadNotifications: Number(unreadNotifications[0]?.count || 0),
        },
        mentees,
        recentEntries,
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
