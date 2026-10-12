// Isolated PostgreSQL cluster for this checkout. Never controls the system service.
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import pg from "pg";

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const stateDir = join(workspace, ".local", "postgres");
const dataDir = join(stateDir, "data");
const envPath = join(workspace, "backend", ".env");
const command = process.argv[2] ?? "start";
const candidates = [
  process.env.POSTGRES_BIN,
  "D:/Program/PostgreSQL/18/bin",
  "C:/Program Files/PostgreSQL/18/bin",
  "C:/Program Files/PostgreSQL/17/bin",
].filter(Boolean);
const bin = candidates.find((candidate) =>
  existsSync(join(candidate, "pg_ctl.exe")),
);
if (!bin)
  throw new Error(
    "Không tìm thấy PostgreSQL. Đặt POSTGRES_BIN tới thư mục chứa pg_ctl.exe và initdb.exe.",
  );
mkdirSync(stateDir, { recursive: true });
function run(name, args, allowStopped = false) {
  // pg_ctl's background server can inherit pipe handles on Windows. Do not pipe it.
  const result = spawnSync(join(bin, `${name}.exe`), args, {
    encoding: "utf8",
    windowsHide: true,
    stdio: name === "pg_ctl" ? "ignore" : "pipe",
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && !(allowStopped && result.status === 3))
    throw new Error(`${name}: ${result.stderr || result.stdout}`);
  return result;
}
function changeEnv(name, value) {
  const current = existsSync(envPath)
    ? readFileSync(envPath, "utf8")
    : readFileSync(join(workspace, "backend", ".env.example"), "utf8");
  const matcher = new RegExp(`^${name}=.*$`, "m");
  writeFileSync(
    envPath,
    matcher.test(current)
      ? current.replace(matcher, `${name}=${value}`)
      : `${current.trimEnd()}\n${name}=${value}\n`,
    { mode: 0o600 },
  );
}

async function isRunning() {
  if (!existsSync(join(dataDir, "PG_VERSION")) || !existsSync(envPath))
    return false;
  process.loadEnvFile(envPath);
  const connection = new URL(process.env.DATABASE_URL);
  if (
    connection.hostname !== "127.0.0.1" ||
    connection.port !== "5433" ||
    connection.username !== "bd_lab"
  )
    throw new Error("Không phải kết nối cluster local của BD Lab.");
  connection.pathname = "/postgres";
  const client = new pg.Client({
    connectionString: connection.toString(),
    connectionTimeoutMillis: 3000,
  });
  try {
    await client.connect();
    const result = await client.query(
      "SELECT current_setting('data_directory') AS directory",
    );
    const normalize = (path) =>
      resolve(path).replaceAll("\\", "/").toLowerCase();
    if (normalize(result.rows[0].directory) !== normalize(dataDir))
      throw new Error("Port 5433 thuộc cluster khác; không thao tác.");
    return true;
  } catch (error) {
    if (error.code === "ECONNREFUSED" || error.code === "57P03") return false;
    throw new Error(
      "Không xác minh được cluster BD Lab. Kiểm tra kết nối và backend/.env.",
    );
  } finally {
    await client.end();
  }
}

if (command === "stop") {
  if (await isRunning())
    run("pg_ctl", ["-D", dataDir, "-m", "fast", "-w", "stop"]);
  console.log("BD Lab local PostgreSQL đã dừng. Dữ liệu vẫn được giữ.");
} else if (command === "status") {
  console.log(
    (await isRunning())
      ? "BD Lab PostgreSQL: running (127.0.0.1:5433)"
      : "BD Lab PostgreSQL: stopped",
  );
} else if (command === "start" || command === "setup") {
  if (!existsSync(join(dataDir, "PG_VERSION"))) {
    const existingEnv = existsSync(envPath)
      ? readFileSync(envPath, "utf8")
      : "";
    const configured = existingEnv.match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
    if (
      configured &&
      !configured.includes("bd_lab:change_me@") &&
      !configured.includes("bd_lab:replace_local_password@")
    )
      throw new Error(
        "DATABASE_URL đã được cấu hình riêng. Không tự ghi đè; dùng database của bạn hoặc đổi lại placeholder để tạo cluster riêng.",
      );
    const password = randomBytes(24).toString("hex");
    const pwFile = join(stateDir, "bootstrap-password");
    writeFileSync(pwFile, `${password}\n`, { mode: 0o600 });
    try {
      run("initdb", [
        "-D",
        dataDir,
        "-U",
        "bd_lab",
        "--encoding=UTF8",
        "--locale=C",
        "--auth-host=scram-sha-256",
        "--auth-local=scram-sha-256",
        `--pwfile=${pwFile}`,
      ]);
    } finally {
      rmSync(pwFile, { force: true });
    }
    changeEnv(
      "DATABASE_URL",
      `postgresql://bd_lab:${password}@127.0.0.1:5433/bd_lab_dev?schema=public`,
    );
    changeEnv(
      "TEST_DATABASE_URL",
      `postgresql://bd_lab:${password}@127.0.0.1:5433/bd_lab_test?schema=public`,
    );
  }
  if (!(await isRunning()))
    run("pg_ctl", [
      "-D",
      dataDir,
      "-l",
      join(stateDir, "server.log"),
      "-o",
      "-p 5433 -h 127.0.0.1",
      "-w",
      "start",
    ]);
  process.loadEnvFile(envPath);
  const connection = new URL(process.env.DATABASE_URL);
  if (
    connection.hostname !== "127.0.0.1" ||
    connection.port !== "5433" ||
    connection.username !== "bd_lab"
  )
    throw new Error(
      "Cluster này chỉ quản lý kết nối bd_lab tại 127.0.0.1:5433.",
    );
  connection.pathname = "/postgres";
  const client = new pg.Client({ connectionString: connection.toString() });
  await client.connect();
  try {
    for (const database of ["bd_lab_dev", "bd_lab_test"]) {
      const found = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [database],
      );
      if (!found.rowCount)
        await client.query(`CREATE DATABASE ${database} OWNER bd_lab`);
    }
  } finally {
    await client.end();
  }
  console.log(
    "BD Lab PostgreSQL sẵn sàng tại 127.0.0.1:5433. Database phát triển và test tách riêng.",
  );
} else throw new Error("Dùng setup, start, stop hoặc status.");
