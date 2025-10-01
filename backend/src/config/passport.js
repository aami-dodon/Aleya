const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const pool = require("../db");
const { logger, serializeError } = require("../utils/logger");

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        logger.info("Google OAuth callback received", {
          profileId: profile.id,
          email: profile.emails?.[0]?.value,
        });

        const googleEmail = profile.emails?.[0]?.value;
        const googleId = profile.id;
        const googleName = profile.displayName || `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim();

        if (!googleEmail) {
          return done(new Error("No email provided by Google"), null);
        }

        // Check if social account already exists
        const existingSocialAccount = await pool.query(
          "SELECT sa.*, u.* FROM social_accounts sa JOIN users u ON sa.user_id = u.id WHERE sa.provider = 'google' AND sa.provider_id = $1",
          [googleId]
        );

        if (existingSocialAccount.rows.length > 0) {
          // User already has Google account linked
          const user = existingSocialAccount.rows[0];
          logger.info("Existing Google user logged in", { userId: user.id, email: user.email });
          return done(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: true, // Social logins are considered verified
            authMethod: user.auth_method,
          });
        }

        // Check if user exists with this email
        const existingUser = await pool.query(
          "SELECT * FROM users WHERE email = $1",
          [googleEmail]
        );

        let userId;

        if (existingUser.rows.length > 0) {
          // Link Google account to existing user
          userId = existingUser.rows[0].id;
          logger.info("Linking Google account to existing user", { userId, email: googleEmail });

          // Update user to hybrid auth method
          await pool.query(
            "UPDATE users SET auth_method = 'hybrid', is_verified = true WHERE id = $1",
            [userId]
          );
        } else {
          // Create new user account
          logger.info("Creating new user from Google OAuth", { email: googleEmail });

          const newUser = await pool.query(
            `INSERT INTO users (email, name, role, is_verified, auth_method, password_hash, created_at, updated_at) 
             VALUES ($1, $2, 'journaler', true, 'social', NULL, NOW(), NOW()) 
             RETURNING id`,
            [googleEmail, googleName]
          );

          userId = newUser.rows[0].id;
        }

        // Create or update social account record
        await pool.query(
          `INSERT INTO social_accounts (user_id, provider, provider_id, provider_email, provider_name, profile_data, created_at, updated_at)
           VALUES ($1, 'google', $2, $3, $4, $5, NOW(), NOW())
           ON CONFLICT (user_id, provider) 
           DO UPDATE SET 
             provider_id = EXCLUDED.provider_id,
             provider_email = EXCLUDED.provider_email,
             provider_name = EXCLUDED.provider_name,
             profile_data = EXCLUDED.profile_data,
             updated_at = NOW()`,
          [
            userId,
            googleId,
            googleEmail,
            googleName,
            JSON.stringify({
              picture: profile.photos?.[0]?.value,
              locale: profile._json?.locale,
              verified_email: profile._json?.verified_email,
            }),
          ]
        );

        // Get final user data
        const finalUser = await pool.query(
          "SELECT * FROM users WHERE id = $1",
          [userId]
        );

        const user = finalUser.rows[0];
        logger.info("Google OAuth successful", { userId: user.id, email: user.email });

        return done(null, {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isVerified: true,
          authMethod: user.auth_method,
        });
      } catch (error) {
        logger.error("Google OAuth error", { error: serializeError(error) });
        return done(error, null);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return done(null, false);
    }
    
    const user = result.rows[0];
    done(null, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.is_verified,
      authMethod: user.auth_method,
    });
  } catch (error) {
    logger.error("User deserialization error", { error: serializeError(error) });
    done(error, null);
  }
});

module.exports = passport;