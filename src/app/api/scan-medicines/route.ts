import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { requireUser, getAuthorizedScope } from "@/lib/pharmacy";

const CATEGORIES = [
  "مسكنات الألم وخافضات الحرارة",
  "مسكنات ومضادات الالتهاب",
  "الحساسية، الأنف، والسعال",
  "الجهاز الهضمي والمعدة",
  "المضادات الحيوية ومضادات الفطريات",
  "المسالك البولية",
  "الفيتامينات والمكملات الغذائية",
  "الجلدية، الجروح، والرضاعة",
  "أدوية متخصصة ومستلزمات طبية",
];

export async function POST(request: NextRequest) {
  try {
    const { user, response } = await requireUser();
    if (!user) return response;
    const scope = await getAuthorizedScope(request, user.id);
    if (!scope.valid) {
      return NextResponse.json({ error: "ليس لديك صلاحية لهذا المخزون" }, { status: 403 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY غير مضبوط" }, { status: 503 });
    }

    const body = await request.json();
    const mimeType = String(body.mimeType || "");
    const imageBase64 = String(body.imageBase64 || "").replace(/^data:[^;]+;base64,/i, "");
    if (!/^image\/(jpeg|png|webp)$/.test(mimeType)) {
      return NextResponse.json({ error: "نوع الصورة غير مدعوم" }, { status: 400 });
    }
    if (!imageBase64 || imageBase64.length > 3_800_000) {
      return NextResponse.json({ error: "الصورة كبيرة جداً" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `حلل الصورة واكتشف جميع أسماء الأدوية والمكملات والمستلزمات الطبية الظاهرة.
أعد JSON فقط على الشكل {"items":[{"name":"","activeIngredient":"","category":"","subCategory":"","usage":"","quantity":1,"expiryDate":"YYYY-MM","status":"valid","rxRequired":false,"notes":""}]}.
الفئة يجب أن تكون واحدة حرفياً من: ${JSON.stringify(CATEGORIES)}.
expiryDate بصيغة YYYY-MM إذا ظهر تاريخ واضح، وإلا "". حدد status="expired" إذا كان الانتهاء قبل الشهر الحالي.
لا تخترع بيانات غير ظاهرة. اجعل quantity رقماً على الأقل 1، واجعل notes يشمل تعليمات أو كتابة يدوية ظاهرة.
اكتب الأسماء والقيم بوضوح ودقة.`;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: imageBase64 } },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
    });

    const text = result.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "لم يستخرج النموذج أي عناصر" }, { status: 422 });
    }

    const parsed = JSON.parse(text);
    const items = Array.isArray(parsed.items) ? parsed.items : Array.isArray(parsed) ? parsed : [];
    return NextResponse.json({ items });
  } catch (error) {
    console.error("POST /api/scan-medicines error:", error);
    return NextResponse.json({ error: "تعذر تحليل الصورة" }, { status: 500 });
  }
}
