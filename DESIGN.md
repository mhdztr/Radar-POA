# DESIGN.md — Desain UI/UX

## Filosofi
Data-first, scannable, taktis ala SiMata. Minimal clutter, fokus pada insight eksekutif.

## Negative Prompt (Wajib Dicek Setiap Komponen Baru)
Dilarang:
- Gauge speedometer
- Chart 3D murahan
- Efek bevel tebal 4px
- Gradien pelangi (rainbow palette)
- Tombol/kontrol berdampingan berbeda tinggi tanpa container
- Inline style override untuk ukuran kontrol
- Card-inside-card berlebihan
- Efek glass berlebihan yang mengurangi keterbacaan

## Tipografi
- **Plus Jakarta Sans**
- `font-variant-numeric: tabular-nums` untuk angka

## Skala Kontrol 3-Tier
| Tier | Tinggi | Penggunaan |
|---|---|---|
| LG | 40px | Primer, toolbar global, tombol submit utama, input form standar |
| MD | 32px | Sekunder, baris tombol modal, filter grid |
| SM | 26px | In-table action (edit/revisi/anulir mini) |

Wajib dibungkus `.ctl-row`, `.ctl-lg`, `.ctl-sm`, `.ctl-stack`. Dilarang inline height/style override.

## Visual
- Translusensi halus (`backdrop-filter: blur(20px)`)
- Border netral tipis `rgba(0,0,0,0.08)`
- Bayangan lembut berdimensi
- Tactile: `:active { transform: scale(0.97); }`
- Fokus state jelas dan accessible
