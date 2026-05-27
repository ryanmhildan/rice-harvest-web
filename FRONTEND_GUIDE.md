# Panduan Konsep React & Next.js untuk Pemula

Dokumen ini menjelaskan konsep-konsep React dan Next.js yang dipakai di proyek ini, **secara ringkas dan praktis**. Tidak meliputi semua fitur React/Next.js — hanya yang relevan untuk proyek skripsi Anda.

> 💡 **Cara memakai dokumen ini**: baca sekali secara cepat, lalu pakai sebagai referensi saat menemui kode yang tidak familiar.

## 1. Komponen — Building Block React

**Komponen** adalah function JavaScript yang return tampilan (HTML-like). Contoh paling sederhana:

```typescript
function Greeting() {
  return <h1>Halo dunia</h1>;
}
```

Cara pakai komponen:
```typescript
<Greeting />
```

Komponen bisa menerima **props** (parameter):
```typescript
function Greeting({ name }: { name: string }) {
  return <h1>Halo {name}</h1>;
}

// Pemakaian:
<Greeting name="Ryan" />
```

**Mengapa komponen?** Reusability + organisasi. Setiap komponen = unit kecil yang fokus pada satu fungsi.

## 2. JSX — HTML di dalam JavaScript

JSX terlihat seperti HTML, tapi ditulis di dalam file `.tsx`. Perbedaan dengan HTML:

| HTML | JSX |
|---|---|
| `class="..."` | `className="..."` |
| `for="..."` | `htmlFor="..."` |
| `<input>` (tanpa close) | `<input />` (self-closing) |
| `style="color: red"` | `style={{ color: "red" }}` |
| Comment: `<!-- -->` | `{/* */}` |

JSX bisa embed JavaScript dengan `{}`:
```tsx
<p>2 + 2 = {2 + 2}</p>          {/* "2 + 2 = 4" */}
<p>{user.name}</p>               {/* render variabel */}
<button onClick={handleClick} /> {/* event handler */}
```

## 3. State — Data yang Berubah

Untuk data yang berubah seiring waktu (input form, status fetch), pakai **useState**:

```typescript
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);  // initial value: 0

  return (
    <div>
      <p>Counter: {count}</p>
      <button onClick={() => setCount(count + 1)}>Tambah</button>
    </div>
  );
}
```

- `count` = nilai saat ini
- `setCount` = fungsi untuk update nilai
- Setiap kali `setCount` dipanggil, komponen **re-render** dengan nilai baru

**Anti-pattern:** jangan ubah `count` langsung — selalu lewat `setCount`.

```typescript
// SALAH ❌
count = count + 1;

// BENAR ✓
setCount(count + 1);
```

## 4. useEffect — Side Effects

Side effect = sesuatu yang mempengaruhi luar komponen (fetch API, setInterval, akses DOM langsung).

```typescript
import { useEffect, useState } from "react";

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Jalan setiap kali userId berubah
    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then(setUser);
  }, [userId]); // dependency array

  if (!user) return <p>Loading...</p>;
  return <h1>{user.name}</h1>;
}
```

**Dependency array `[userId]`** menentukan kapan effect jalan:
- `[]` — sekali saja saat komponen pertama mount
- `[userId]` — setiap kali `userId` berubah
- (tidak ada) — setiap render (jarang dipakai)

**Cleanup function** untuk hindari memory leak:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    console.log("polling...");
  }, 5000);

  // Return = cleanup yang jalan saat unmount atau effect re-run
  return () => clearInterval(interval);
}, []);
```

## 5. Server Component vs Client Component (Next.js App Router)

Default di Next.js App Router: **Server Component** — di-render di Node.js sebelum dikirim ke browser. Lebih cepat, tapi tidak bisa interaktif.

**Client Component** — di-render di browser. Bisa pakai state, event, useEffect. Ditandai dengan `"use client"` di baris pertama file:

```typescript
"use client";

import { useState } from "react";

export default function MyPage() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Kapan pakai apa?**

| Pakai Server Component kalau | Pakai Client Component kalau |
|---|---|
| Render statis (hero, footer, doc) | Butuh useState, useEffect, useRef |
| Fetch data dari database/API di server | Event handler (onClick, onChange) |
| Tidak butuh interaksi | Form, animation, real-time UI |

**Aturan praktis untuk proyek ini**: hampir semua page kita pakai `"use client"` karena banyak interaktivitas. Layout root TIDAK pakai (cukup statis).

## 6. File-based Routing (App Router)

Next.js otomatis convert struktur folder jadi URL:

```
app/
├── page.tsx                       → /
├── upload/page.tsx                → /upload
├── results/page.tsx               → /results
├── results/[timestamp]/page.tsx   → /results/<timestamp dinamis>
└── jobs/[jobId]/page.tsx          → /jobs/<jobId dinamis>
```

Folder `[xxx]` artinya **dynamic segment**. Value diambil dari URL.

Cara akses params (Next.js 15):
```typescript
interface PageProps {
  params: Promise<{ jobId: string }>;
}

export default function JobPage({ params }: PageProps) {
  // params adalah Promise di Next.js 15!
  const [jobId, setJobId] = useState<string | null>(null);
  useEffect(() => {
    params.then((p) => setJobId(p.jobId));
  }, [params]);

  return <div>Job ID: {jobId}</div>;
}
```

## 7. Navigation antar halaman

**JANGAN** pakai `<a href>` untuk internal links — itu reload halaman penuh.

**PAKAI** `<Link>` dari `next/link`:

```typescript
import Link from "next/link";

<Link href="/upload">Mulai Upload</Link>
```

Client-side navigation = jauh lebih cepat karena tidak reload.

Untuk programmatic navigation (mis. setelah submit form):
```typescript
"use client";
import { useRouter } from "next/navigation";

const router = useRouter();
router.push(`/jobs/${jobId}`);
```

## 8. Fetch Data dari Backend

Standar: pakai `fetch()` (browser API).

```typescript
const response = await fetch("http://localhost:8000/health");
const data = await response.json();
```

Di proyek ini, kita sudah bungkus jadi `api` object:
```typescript
import { api } from "@/lib/api";
const health = await api.getHealth();
```

Cara pakai di komponen:
```typescript
"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

function HealthDisplay() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.getHealth().then(setHealth);
  }, []);

  if (!health) return <p>Loading...</p>;
  return <p>Status: {health.status}</p>;
}
```

## 9. Tailwind CSS — Styling dengan Class

Tailwind = utility-first CSS. Setiap class kecil dan fokus:

```tsx
<div className="bg-green-700 text-white p-4 rounded-md">
  Tombol
</div>
```

Class umum yang dipakai di proyek ini:

| Kategori | Class | Arti |
|---|---|---|
| Background | `bg-green-700` | hijau (700 = tone gelap) |
| Text | `text-white`, `text-slate-600` | warna teks |
| Padding | `p-4`, `px-6`, `py-2` | padding all/x/y |
| Margin | `m-4`, `mt-2`, `mx-auto` | margin |
| Border | `border`, `border-slate-200`, `rounded-md` | border + radius |
| Layout | `flex`, `grid grid-cols-3`, `gap-4` | flex/grid |
| Spacing | `space-y-4` | gap vertikal antar children |
| Size | `w-full`, `h-12`, `max-w-7xl` | width/height |
| Responsive | `sm:px-6 md:px-8 lg:px-12` | breakpoint |
| Hover | `hover:bg-green-800` | saat hover |

**Tip pemula**: Ekstensi VS Code "Tailwind CSS IntelliSense" beri autocomplete. Wajib install.

## 10. Composition Class dengan `cn()`

Di proyek kita ada utility `cn()` untuk merge class:

```typescript
import { cn } from "@/lib/utils";

<button
  className={cn(
    "px-4 py-2 rounded-md",                  // selalu ada
    isActive && "bg-green-700 text-white",   // conditional
    className                                  // dari parent
  )}
/>
```

Fungsi `cn()` resolve konflik Tailwind otomatis. Misal `"bg-red-500"` + `"bg-blue-500"` → hanya `"bg-blue-500"` yang aktif.

## 11. TypeScript dalam 5 Menit

TypeScript = JavaScript + type checking. Tujuan: catch bug sebelum runtime.

```typescript
// Annotate parameter type
function greet(name: string): string {
  return `Halo ${name}`;
}

greet(123);  // ERROR di compile-time: "Argument of type 'number' is not assignable to type 'string'"

// Type untuk object
interface User {
  id: string;
  name: string;
  age: number;
}

const u: User = { id: "1", name: "Ryan", age: 22 };

// Type untuk function component
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;  // ? = optional
}

function MyButton({ label, onClick, disabled = false }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>{label}</button>;
}
```

## 12. Folder Struktur Proyek (Cheat Sheet)

```
rice-harvest-web/
├── app/                  ← Halaman & layout (App Router)
├── components/           ← Komponen reusable
│   └── ui/               ← Komponen UI generik
├── lib/                  ← Utility (api, types, helpers)
├── public/               ← Static assets (gambar, favicon)
├── .env.local            ← Environment variables (jangan commit!)
├── package.json          ← Dependencies + scripts
├── tailwind.config.ts    ← Tailwind config
├── tsconfig.json         ← TypeScript config
└── next.config.ts        ← Next.js config
```

## 13. Command yang Sering Dipakai

```bash
# Install dependencies (sekali setelah clone)
npm install

# Development server (hot reload, port 3001)
npm run dev

# Type-check tanpa build
npx tsc --noEmit

# Production build (test sebelum deploy)
npm run build

# Production start (setelah build)
npm start

# Install library baru
npm install nama-library

# Install library development only
npm install -D nama-library
```

## 14. Tips Belajar Sambil Bangun

1. **Baca error** — error JavaScript biasanya jelas. Stack trace menunjukkan baris yang masalah.
2. **Console.log** — `console.log(variable)` di code → buka DevTools (F12) browser tab Console untuk lihat output.
3. **React DevTools** — install ekstensi browser, bisa lihat state semua komponen secara live.
4. **Restart dev server** — kalau ada perilaku aneh, kadang `Ctrl+C` dan `npm run dev` lagi cukup.
5. **Pakai TypeScript hint** — hover variabel di VS Code untuk lihat type-nya.

## 15. Antipattern yang Harus Dihindari

❌ **Ubah state langsung**:
```typescript
files.push(newFile);  // SALAH
setFiles([...files, newFile]);  // BENAR
```

❌ **Pakai `useEffect` untuk transformasi sederhana**:
```typescript
// SALAH
const [doubled, setDoubled] = useState(0);
useEffect(() => {
  setDoubled(count * 2);
}, [count]);

// BENAR
const doubled = count * 2;
```

❌ **Lupa cleanup di useEffect**:
```typescript
// SALAH - memory leak
useEffect(() => {
  setInterval(poll, 5000);
}, []);

// BENAR
useEffect(() => {
  const id = setInterval(poll, 5000);
  return () => clearInterval(id);
}, []);
```

❌ **Akses `window` di Server Component**:
```typescript
// SALAH - crash di server
const w = window.innerWidth;

// BENAR - di useEffect (client-only)
useEffect(() => {
  const w = window.innerWidth;
}, []);
```

❌ **Inline style kompleks**:
```typescript
// JELEK
<div style={{ padding: "16px", color: "white", background: "green" }}>

// BAGUS
<div className="p-4 text-white bg-green-700">
```

---

Selamat belajar. **Kalau bingung dengan kode tertentu di proyek ini, tunjuk baris tersebut ke Claude / AI assistant — saya akan jelaskan konsep di balik kode tersebut secara spesifik.**
