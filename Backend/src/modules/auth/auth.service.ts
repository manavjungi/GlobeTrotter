import { pool } from "../../config/database.js";
import { hashPassword, comparePassword } from "../../utils/password.js";
import { generateAccessToken } from "../../utils/jwt.js";

interface RegisterInput {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  countryId?: number;
  cityId?: number;
}

interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser(
  input: RegisterInput
) {
  const existingUser = await pool.query(
    `
      SELECT id
      FROM users
      WHERE email = $1
         OR username = $2
      LIMIT 1
    `,
    [
      input.email,
      input.username
    ]
  );

  if (existingUser.rows.length > 0) {
    throw new Error(
      "Email or username already exists"
    );
  }

  const passwordHash =
    await hashPassword(input.password);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `
        INSERT INTO users (
          username,
          email,
          password_hash,
          first_name,
          last_name,
          phone,
          country_id,
          city_id
        )
        VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8
        )
        RETURNING
          id,
          username,
          email,
          first_name,
          last_name,
          phone,
          country_id,
          city_id,
          role,
          created_at
      `,
      [
        input.username,
        input.email,
        passwordHash,
        input.firstName,
        input.lastName ?? null,
        input.phone ?? null,
        input.countryId ?? null,
        input.cityId ?? null
      ]
    );

    const user =
      userResult.rows[0];

    await client.query(
      `
        INSERT INTO user_preferences (
          user_id
        )
        VALUES ($1)
      `,
      [user.id]
    );

    await client.query("COMMIT");

    const token =
      generateAccessToken(user.id);

    return {
      user,
      token
    };

  } catch (error) {

    await client.query("ROLLBACK");

    throw error;

  } finally {

    client.release();

  }
}

export async function loginUser(
  input: LoginInput
) {
  const result = await pool.query(
    `
      SELECT
        id,
        username,
        email,
        password_hash,
        first_name,
        last_name,
        role,
        is_active,
        email_verified
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [input.email]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error(
      "Invalid email or password"
    );
  }

  if (!user.is_active) {
    throw new Error(
      "Account is inactive"
    );
  }

  const validPassword =
    await comparePassword(
      input.password,
      user.password_hash
    );

  if (!validPassword) {
    throw new Error(
      "Invalid email or password"
    );
  }

  await pool.query(
    `
      UPDATE users
      SET last_login_at = NOW()
      WHERE id = $1
    `,
    [user.id]
  );

  const token =
    generateAccessToken(user.id);

  delete user.password_hash;

  return {
    user,
    token
  };
}