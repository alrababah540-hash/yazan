# Narration script — «ما هو العقار على المخطط (أوف بلان) في أبوظبي؟»

Voice: Piper neural TTS, `ar_JO-kareem-medium` (male, Levantine-leaning Arabic), rendered offline.
Register: natural, warm, conversational Arabic suitable for UAE audiences (white-dialect phrasing such as «بتلاقي»، «عشان هيك»).
Pronunciation is steered with hand-written diacritics (the `tts` field in `audio/narration.json`); on-screen captions use the clean text.

| # | Scene | VO in (s) | Length (s) | Arabic narration (as captioned) |
|---|-------|-----------|------------|----------------------------------|
| 1 | Hook | 1.00 | 4.05 | تخيل تشتري شقة… قبل ما يكتمل بناؤها! |
| 2 | What is off-plan | 6.90 | 9.93 | هذا هو الأوف بلان، أو الشراء على المخطط. يعني تشتري وحدة عقارية قبل اكتمال المشروع أو أثناء تطويره. |
| 3 | Abu Dhabi | 17.60 | 7.82 | وفي أبوظبي، بتلاقي مشاريع عقارية في مناطق مثل ياس والسعديات والريم. |
| 4 | Choosing a unit | 25.90 | 8.07 | بتختار المشروع والوحدة المناسبة، وبتراجع المخطط والمساحة والإطلالة والتفاصيل. |
| 5 | Payment plan | 34.50 | 8.31 | وبتدفع حسب خطة الدفع وشروط العقد، والدفعات ممكن تتوزع على مراحل تطوير المشروع. |
| 6 | Why off-plan | 43.30 | 8.75 | البعض بيختار الأوف بلان لتنوع الوحدات، أو لتوزيع الدفعات، أو للتخطيط لشراء عقار مستقبلي. |
| 7 | Risks & verification | 52.40 | 13.35 | لكن مهم تعرف إن في مخاطر، مثل تأخر التسليم وتغير الأسعار. عشان هيك، لازم تتحقق من المطور والمشروع وتقرأ العقد وخطة الدفع. |
| 8 | Final message | 66.60 | 7.17 | الأوف بلان مش مجرد شراء على المخطط… هو قرار يبدأ بالمعلومة الصحيحة. |

Total speech: 67.4 s inside a 76.0 s film.

## On-screen text (exact)

| Time (s) | Text |
|----------|------|
| 1.6–6.1 | OFF-PLAN · ABU DHABI / كيف تشتري عقاراً قبل أن يُبنى؟ |
| 8.1–14.8 | OFF-PLAN / الشراء على المخطط |
| 11.0–15.3 | المخطط · FLOOR PLAN (label on plan panel) |
| 18.2–21.2 | ABU DHABI / أبوظبي |
| 21.3–25.5 | جزيرة ياس · جزيرة السعديات · جزيرة الريم (map labels, at OSM-verified locations) |
| 26.0–33.9 | المشروع ← الوحدة ← التفاصيل (steps light up in sync) |
| 35.4–42.4 | PAYMENT PLAN / خطة الدفع تختلف من مشروع لآخر |
| 35.8–42.4 | الحجز والعقد · دفعات أثناء البناء · التسليم (milestone labels, no percentages) |
| 43.4–51.9 | خيارات ‖ دفعات مرحلية ‖ تخطيط للمستقبل (active chip follows the match cuts) |
| 52.8–58.1 | RISKS / مخاطر يجب معرفتها; labels «تأخّر التسليم» and «تغيّر الأسعار» |
| 58.5–65.8 | VERIFY / تحقق قبل أن تقرر; checklist ✓ المطوّر ✓ المشروع ✓ العقد ✓ خطة الدفع |
| 63.8–65.8 | تحقّق من بيانات المشروع وحساب الضمان (Escrow) لدى الجهات الرسمية، مثل مركز أبوظبي العقاري (ADREC) |
| 70.3–76.0 | اعرف المشروع. / افهم التفاصيل. / اختار بوعي. |
| 73.5–76.0 | CTA: اكتشف المزيد عن عقارات أبوظبي (unbranded) |

Burned-in Arabic captions follow the narration throughout (chunked at punctuation).

## Accuracy & compliance notes

- No installment percentages, prices, yields, appreciation or guarantees are stated or shown. The chart in Scene 7 has no axes or figures.
- No real projects, developers or brands are depicted; the tower, apartment layouts and contract are generic illustrations (the contract is labelled «نموذج توضيحي»).
- Map shows **areas** (Yas, Saadiyat, Al Reem islands) only, using OpenStreetMap-derived coastlines; no project is placed on the map.
- Regulatory reference (Scene 7 footnote) was checked on 2026-11-19 against law-firm summaries of Abu Dhabi Law No. 3 of 2015, as amended by Law No. 2 of 2025, which requires a dedicated escrow account per off-plan project, with the Abu Dhabi Real Estate Centre (ADREC) and the Department of Municipalities and Transport issuing the implementing decisions. Before publishing, check it against the official ADREC / DMT text.


---

# English version — "What is off-plan real estate in Abu Dhabi?"

Voice: **Kokoro-82M** (Apache-2.0), voice `bm_george` (warm British male), rendered offline via sherpa-onnx 1.12. Whisper ASR round-trip similarity: **98.4 %** (`audio/vo_en/asr_check.json`).

| # | VO in (s) | Length (s) | Narration |
|---|-----------|------------|-----------|
| 1 | 1.20 | 3.37 | Imagine buying an apartment… before it's even built. |
| 2 | 7.60 | 6.78 | This is off-plan: buying a property before the project is completed, or while it's still under development. |
| 3 | 18.60 | 6.36 | In Abu Dhabi, you'll find real-estate projects in areas like Yas, Saadiyat and Al Reem. |
| 4 | 26.60 | 6.52 | You choose the project and the right unit, then review the floor plan, the size, the view and the details. |
| 5 | 35.00 | 7.65 | You pay according to the payment plan and the contract terms, and payments may be spread across the project's development stages. |
| 6 | 43.60 | 6.64 | Some choose off-plan for the variety of units, for staged payments, or to plan a future property purchase. |
| 7 | 53.20 | 10.33 | But there are risks, like handover delays and price changes. So verify the developer and the project, and read the contract and the payment plan. |
| 8 | 67.20 | 5.93 | Off-plan isn't just buying from a plan… it's a decision that starts with the right information. |

Total speech: 53.6 s in the same 76.0 s cut (identical visuals and scene timings).

On-screen text (EN): "How do you buy a home before it’s built?" · "OFF-PLAN / Buying from the plan" · "Abu Dhabi" · Yas / Saadiyat / Al Reem Island (Arabic sub-labels) · "Project → Unit → Details" · "Payment plans vary from project to project" · Booking & contract / Construction installments / Handover · "Choice | Staged payments | Future planning" · "Risks to know", "Handover delay", "Price changes" · "Verify before you decide" ✓ Developer ✓ Project ✓ Contract ✓ Payment plan · escrow/ADREC footnote · "Know the project. Understand the details. Choose wisely." · CTA "Discover more about Abu Dhabi real estate". Floor-plan room names and the illustrative contract are also in English.
